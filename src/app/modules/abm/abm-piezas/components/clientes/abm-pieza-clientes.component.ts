import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconRegistry } from '@angular/material/icon';
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

  clientes$: Array<any> = [];
  selectedClients = new MatTableDataSource<PiezaCliente>([]);

  baseDisplayedColumns: string[] = ['idCliente', 'nombreCliente', 'nombrePiezaCliente'];
  displayedColumnsClients: string[];

  clienteForm: FormGroup;
  sinDatos: boolean = false;
  isLoading: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private matIconRegistry: MatIconRegistry,
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
    if (this.mode === 'view') {
      this.displayedColumnsClients = this.baseDisplayedColumns;
    } else {
      this.displayedColumnsClients = [...this.baseDisplayedColumns, 'acciones'];
    }
  }

  loadClientesDropdown(): void {
    this.subscription.add(
      this._clients.getClientes().subscribe({
        next: (res: any) => {
          this.clientes$ = res && res.data ? res.data : [];
        },
        error: (err: any) => {
          console.error('Error al cargar la lista de clientes:', err);
          this.openSnackBar(false, 'Error al cargar la lista de clientes.');
        }
      })
    );
  }

  loadSelectedClients(): void {
    this.isLoading = true;
    this.subscription.add(
      this.abmPiezaService.getClientesPorPieza(this.piezaId).subscribe({
        next: (response: any) => {
          const clientesAsociados = response && response.data ? response.data : [];
          this.selectedClients.data = clientesAsociados;
          this.sinDatos = clientesAsociados.length === 0;
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error al cargar los clientes asociados:', err);
          this.openSnackBar(false, 'Error al cargar los clientes asociados.');
          this.sinDatos = true;
          this.isLoading = false;
          this.selectedClients.data = [];
        }
      })
    );
  }

  agregarCliente(): void {
    if (this.clienteForm.invalid) {
      this.openSnackBar(false, 'Por favor, seleccione un cliente.');
      return;
    }

    const clienteId = this.clienteForm.get('clienteId').value;
    const nombrePersonalizado = this.clienteForm.get('nombrePiezaPersonalizado').value;

    const selectedClient = this.clientes$.find(cliente => cliente.id === clienteId);
    if (!selectedClient) {
      this.openSnackBar(false, 'Cliente no encontrado.');
      return;
    }

    const alreadyAdded = this.selectedClients.data.some(c => c.idCliente === selectedClient.id);
    if (alreadyAdded) {
      this.openSnackBar(false, 'El cliente ya está asociado a esta pieza.');
      return;
    }

    const dto = {
      idPieza: this.piezaId,
      idCliente: selectedClient.id,
      nombreCliente: selectedClient.nombre,
      nombrePiezaCliente: nombrePersonalizado
    };

    this.isLoading = true;
    this.subscription.add(
      this.abmPiezaService.agregarClienteAPieza(dto).subscribe({
        next: () => {
          this.openSnackBar(true, 'Cliente agregado correctamente.', 'green');
          this.loadSelectedClients();
          this.clienteForm.reset();
          this.clienteForm.updateValueAndValidity();
        },
        error: (err) => {
          console.error('Error al agregar el cliente:', err);
          this.openSnackBar(false, 'Error al agregar el cliente.');
          this.isLoading = false;
        }
      })
    );
  }

  eliminarCliente(row: PiezaCliente): void {
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar la asociación con el cliente <span class="font-bold">${row.nombreCliente}</span>?`);
    this.openConfirmationModal(mensaje, () => {
      this.isLoading = true;
      this.subscription.add(
        this.abmPiezaService.eliminarClienteDePieza(row.id).subscribe({
          next: () => {
            this.openSnackBar(true, 'Cliente eliminado correctamente.', 'green');
            this.loadSelectedClients();
          },
          error: (err) => {
            console.error('Error al eliminar el cliente:', err);
            this.openSnackBar(false, 'Error al eliminar el cliente.');
            this.isLoading = false;
          }
        })
      );
    });
  }

  openConfirmationModal(message: SafeHtml, onConfirm: () => void): void {
    this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: message,
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning',
        onConfirm: onConfirm
      }
    });
  }

  private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
    const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
    const defaultCss: string = css ? css : 'red';
    const snackBarMessage = message ? message : defaultMessage;
    const snackBarCss = css ? css : defaultCss;
    const snackBarDuration = duration ? duration : 5000;

    this.snackBar.open(snackBarMessage, 'X', {
      duration: snackBarDuration,
      panelClass: `${snackBarCss}-snackbar`,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}