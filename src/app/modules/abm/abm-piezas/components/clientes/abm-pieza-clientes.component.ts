import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Observable, Subscription, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ClientesService } from 'app/shared/services/clientes.service';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { PiezaCliente } from '../../models/pieza.model';

interface Cliente {
  id: number;
  nombre: string;
  codigo?: string;
}

@Component({
  selector: 'app-abm-pieza-clientes',
  templateUrl: './abm-pieza-clientes.component.html',
  styleUrls: ['./abm-pieza-clientes.component.scss']
})
export class ABMPiezaClientesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  clientesDisponibles: Cliente[] = [];
  filteredClientes$: Observable<Cliente[]>;
  selectedClients = new MatTableDataSource<PiezaCliente>([]);

  baseDisplayedColumns: string[] = ['codigoCliente', 'nombreCliente', 'nombrePiezaPersonalizado', 'cotizacion', 'fechaCotizacion', 'observacionesCotizacion'];
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
      cliente: [null, Validators.required],
      nombrePiezaPersonalizado: [''],
      cotizacion: [null, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')],
      observacionesCotizacion: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    this.loadClientesDropdown();
    if (this.piezaId) {
      this.loadSelectedClients();
    }

    this.clienteForm.get('cotizacion').valueChanges.subscribe(value => {
      const obsControl = this.clienteForm.get('observacionesCotizacion');
      if (value) {
        obsControl.enable();
      } else {
        obsControl.disable();
        obsControl.reset();
      }
    });
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
        next: (res: any) => {
          this.clientesDisponibles = res?.data || [];
          this.filteredClientes$ = this.clienteForm.get('cliente').valueChanges.pipe(
            startWith(''),
            map(value => this._filterClientes(value))
          );
        },
        error: (err) => {
          console.error('Error al cargar la lista de clientes:', err);
          this.notificationService.showError('Error al cargar la lista de clientes.');
        }
      })
    );
  }

  private _filterClientes(value: string | Cliente): Cliente[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    if (!filterValue) {
      return this.clientesDisponibles;
    }
    return this.clientesDisponibles.filter(cliente =>
      cliente.nombre.toLowerCase().includes(filterValue) ||
      (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
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
    const selectedClienteId = formValue.cliente.id;

    if (this.editMode) {
      const dto = {
        idCliente: this.clienteToEdit.idCliente,
        idPieza: this.piezaId,
        nombrePiezaPersonalizado: formValue.nombrePiezaPersonalizado,
        cotizacion: formValue.cotizacion,
        observacionesCotizacion: formValue.observacionesCotizacion
      };
      this.subscription.add(
        this.abmPiezaService.actualizarClienteDePieza(this.clienteToEdit.id, dto).subscribe(this.handleResponse('Cliente actualizado'))
      );
    } else {
      const alreadyAdded = this.selectedClients.data.some(c => c.idCliente === selectedClienteId);
      if (alreadyAdded) {
        this.notificationService.showError('El cliente ya está asociado a esta pieza.');
        this.isLoading = false;
        return;
      }
      const dto = {
        idCliente: selectedClienteId,
        idPieza: this.piezaId,
        nombrePiezaPersonalizado: formValue.nombrePiezaPersonalizado,
        cotizacion: formValue.cotizacion,
        observacionesCotizacion: formValue.observacionesCotizacion
      };
      this.subscription.add(
        this.abmPiezaService.agregarClienteAPieza(dto).subscribe(this.handleResponse('Cliente agregado'))
      );
    }
  }

  startEdit(cliente: PiezaCliente): void {
    this.editMode = true;
    this.clienteToEdit = cliente;
    const clienteObj = this.clientesDisponibles.find(c => c.id === cliente.idCliente);
    this.clienteForm.patchValue({
      cliente: clienteObj,
      nombrePiezaPersonalizado: cliente.nombrePiezaPersonalizado,
      cotizacion: cliente.cotizacion,
      observacionesCotizacion: cliente.observacionesCotizacion
    });
    this.clienteForm.get('cliente').disable();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.clienteToEdit = null;
    this.clienteForm.reset();
    this.clienteForm.get('cliente').enable();
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

  displayCliente(cliente: Cliente): string {
    return cliente && cliente.nombre ? cliente.nombre : '';
  }

  get buttonText(): string {
    return this.editMode ? 'Actualizar' : 'Agregar';
  }
}