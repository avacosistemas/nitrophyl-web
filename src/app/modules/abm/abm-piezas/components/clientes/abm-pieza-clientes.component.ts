import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Observable, Subscription } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ClientesService } from 'app/shared/services/clientes.service';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { PiezaCliente } from '../../models/pieza.model';

@Component({
  selector: 'app-abm-pieza-clientes',
  templateUrl: './abm-pieza-clientes.component.html',
  styleUrls: ['./abm-pieza-clientes.component.scss']
})
export class ABMPiezaClientesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  clientesDisponibles$: Array<any> = [];
  selectedClients = new MatTableDataSource<PiezaCliente>([]);

  baseDisplayedColumns: string[] = ['idCliente', 'nombreCliente', 'nombrePiezaPersonalizado'];
  displayedColumnsClients: string[];

  clienteForm: FormGroup;
  sinDatos: boolean = false;
  isLoading: boolean = false;
  editMode: boolean = false;
  clienteToEdit: PiezaCliente | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private domSanitizer: DomSanitizer,
    private _clients: ClientesService
  ) {
    super(fb, router, route, abmPiezaService, dialog);
    this.clienteForm = this.fb.group({
      clienteId: [null, Validators.required],
      nombrePiezaPersonalizado: ['']
    });
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    this.loadClientesDropdown();
    if (this.piezaId) {
      this.loadSelectedClients();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
      if (this.mode === 'view') {
        this.clienteForm.disable();
      } else {
        this.clienteForm.enable();
      }
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadSelectedClients();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setDisplayedColumns(): void {
    this.displayedColumnsClients = this.mode === 'view'
      ? this.baseDisplayedColumns
      : [...this.baseDisplayedColumns, 'acciones'];
  }

  loadClientesDropdown(): void {
    this.subscription.add(
      this._clients.getClientes().subscribe({
        next: (res: any) => this.clientesDisponibles$ = res?.data || [],
        error: (err) => {
          console.error('Error al cargar la lista de clientes:', err);
          this.notificationService.showError('Error al cargar la lista de clientes.');
        }
      })
    );
  }

  loadSelectedClients(): void {
    this.isLoading = true;
    this.subscription.add(
      this.abmPiezaService.getClientesPorPieza(this.piezaId).subscribe({
        next: (response) => {
          const clientesAsociados = response?.data || [];
          this.selectedClients.data = clientesAsociados;
          this.sinDatos = clientesAsociados.length === 0;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar los clientes asociados:', err);
          this.notificationService.showError('Error al cargar los clientes asociados.');
          this.sinDatos = true;
          this.isLoading = false;
        }
      })
    );
  }

  addOrUpdateCliente(): void {
    if (this.clienteForm.invalid) {
      this.notificationService.showError('Por favor, complete los campos requeridos.');
      return;
    }

    this.isLoading = true;
    const formValue = this.clienteForm.value;

    if (this.editMode) {
      const dto = {
        idCliente: this.clienteToEdit.idCliente,
        idPieza: this.piezaId,
        nombrePiezaPersonalizado: formValue.nombrePiezaPersonalizado
      };
      this.subscription.add(
        this.abmPiezaService.actualizarClienteDePieza(this.clienteToEdit.id, dto).subscribe(this.handleResponse('Cliente actualizado'))
      );
    } else {
      const alreadyAdded = this.selectedClients.data.some(c => c.idCliente === formValue.clienteId);
      if (alreadyAdded) {
        this.notificationService.showError('El cliente ya está asociado a esta pieza.');
        this.isLoading = false;
        return;
      }
      const dto = {
        idCliente: formValue.clienteId,
        idPieza: this.piezaId,
        nombrePiezaPersonalizado: formValue.nombrePiezaPersonalizado
      };
      this.subscription.add(
        this.abmPiezaService.agregarClienteAPieza(dto).subscribe(this.handleResponse('Cliente agregado'))
      );
    }
  }

  startEdit(cliente: PiezaCliente): void {
    this.editMode = true;
    this.clienteToEdit = cliente;
    this.clienteForm.patchValue({
      clienteId: cliente.idCliente,
      nombrePiezaPersonalizado: cliente.nombrePiezaPersonalizado
    });
    this.clienteForm.get('clienteId').disable();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.clienteToEdit = null;
    this.clienteForm.reset();
    this.clienteForm.get('clienteId').enable();
  }

  private handleResponse(successMessage: string) {
    return {
      next: () => {
        this.notificationService.showSuccess(`${successMessage} correctamente.`);
        this.cancelEdit();
        this.loadSelectedClients();
      },
      error: (err) => {
        console.error(`Error al procesar cliente:`, err);
        this.notificationService.showError(`Error al ${successMessage.toLowerCase()}.`);
        this.isLoading = false;
      }
    };
  }

  eliminarCliente(row: PiezaCliente): void {
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar la asociación con el cliente <span class="font-bold">${row.nombreCliente}</span>?`);

    const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.subscription.add(
          this.abmPiezaService.eliminarClienteDePieza(row.id).subscribe(this.handleResponse('Cliente eliminado'))
        );
      }
    });
    this.subscription.add(sub);
  }

  openConfirmationModal(message: SafeHtml): Observable<boolean> {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: message,
        showConfirmButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning',
      }
    });

    return dialogRef.afterClosed();
  }

  get buttonText(): string {
    return this.editMode ? 'Actualizar' : 'Agregar';
  }
}