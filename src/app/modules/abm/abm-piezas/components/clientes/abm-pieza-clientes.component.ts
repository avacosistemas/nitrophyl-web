import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Observable, Subscription } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { PiezaCliente } from '../../models/pieza.model';
import { ABMPiezaClienteModalComponent } from './modal/abm-pieza-cliente-modal.component';

@Component({
  selector: 'app-abm-pieza-clientes',
  templateUrl: './abm-pieza-clientes.component.html',
  styleUrls: ['./abm-pieza-clientes.component.scss']
})
export class ABMPiezaClientesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  selectedClients = new MatTableDataSource<PiezaCliente>([]);
  baseDisplayedColumns: string[] = ['nombreCliente', 'nombrePiezaPersonalizado', 'cotizacion', 'fechaCotizacion', 'observacionesCotizacion'];
  displayedColumnsClients: string[];

  sinDatos: boolean = false;
  isLoading: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private domSanitizer: DomSanitizer
  ) {
    super(fb, router, route, abmPiezaService, dialog);
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    if (this.piezaId) {
      this.loadSelectedClients();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
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

  openModal(cliente?: PiezaCliente): void {
    const dialogRef = this.dialog.open(ABMPiezaClienteModalComponent, {
      width: '600px',
      disableClose: true,
      data: {
        piezaId: this.piezaId,
        clienteAsociado: cliente
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadSelectedClients();
      }
    });
  }

  eliminarCliente(row: PiezaCliente): void {
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar la asociación con el cliente <span class="font-bold">${row.nombreCliente}</span>?`);

    const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.subscription.add(
          this.abmPiezaService.eliminarClienteDePieza(row.id).subscribe({
            next: () => {
              this.notificationService.showSuccess('Cliente eliminado correctamente.');
              this.loadSelectedClients();
            },
            error: (err) => {
              this.notificationService.showError('Error al eliminar cliente.');
              this.isLoading = false;
            }
          })
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
}