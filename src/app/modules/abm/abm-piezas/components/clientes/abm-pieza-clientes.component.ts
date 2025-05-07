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

@Component({
  selector: 'app-abm-pieza-clientes',
  templateUrl: './abm-pieza-clientes.component.html',
  styleUrls: ['./abm-pieza-clientes.component.scss']
})
export class ABMPiezaClientesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  clientes$: Array<any> = [];
  selectedClients = new MatTableDataSource<{ idCliente: number; nombre: string }>([]);

  baseDisplayedColumns: string[] = ['idCliente', 'nombre'];
  displayedColumnsClients: string[];

  clienteForm: FormGroup;
  sinDatos: boolean = false;
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
      clienteId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    this.loadClientes();
    this.loadSelectedClients();
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

  loadClientes(): void {
    this.subscription.add(
      this._clients.getClientes().subscribe({
        next: (res: any) => {
          if (res && res.data) {
            this.clientes$ = res.data;
          } else {
            console.warn('No se recibieron datos de clientes o el formato es incorrecto.');
            this.clientes$ = [];
          }
        },
        error: (err: any) => {
          console.error('Error al cargar los clientes:', err);
          this.openSnackBar(false, 'Error al cargar los clientes.');
          this.clientes$ = [];
        }
      })
    );
  }

  loadSelectedClients(): void {
    this.subscription.add(
      this.abmPiezaService.getClientes().subscribe({
        next: (clientes: any) => {
          if (clientes && clientes.data) {
            this.selectedClients = new MatTableDataSource<{ idCliente: number; nombre: string }>(clientes.data);
            this.selectedClients.data.length === 0 ? this.sinDatos = true : this.sinDatos = false;
          } else {
            console.warn('No se recibieron datos de clientes seleccionados o el formato es incorrecto.');
            this.sinDatos = true;
            this.selectedClients = new MatTableDataSource<{ idCliente: number; nombre: string }>([]);
          }
        },
        error: (err: any) => {
          console.error('Error al cargar los clientes seleccionados:', err);
          this.openSnackBar(false, 'Error al cargar los clientes seleccionados.');
          this.sinDatos = true;
          this.selectedClients = new MatTableDataSource<{ idCliente: number; nombre: string }>([]);
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

    const data = this.selectedClients.data;
    data.push({ idCliente: selectedClient.id, nombre: selectedClient.nombre });
    this.selectedClients.data = data;
    this.sinDatos = false;

    const clienteData = {
      clienteId: selectedClient.id,
      nombre: selectedClient.nombre,
      piezaId: this.piezaId
    };

    this.clienteForm.reset();
    this.clienteForm.updateValueAndValidity();
    this.guardarClientesMock(clienteData, 'Cliente agregado.');
  }

  eliminarCliente(row: any): void {
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar al cliente <span class="font-bold">${row.nombre}</span>?`);
    this.openConfirmationModal(mensaje, () => {
      const data = this.selectedClients.data;
      data.splice(data.indexOf(row), 1);
      this.selectedClients.data = data;
      this.selectedClients.data.length === 0 ? this.sinDatos = true : this.sinDatos = false;
      this.guardarClientesMock(row, 'Cliente eliminado.');
    });
  }

  openConfirmationModal(message: SafeHtml, onConfirm: () => void): void {
    const dialogRef = this.dialog.open(GenericModalComponent, {
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

  guardarClientesMock(data: any, message: string): void {
    this.openSnackBar(true, message, 'green');
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