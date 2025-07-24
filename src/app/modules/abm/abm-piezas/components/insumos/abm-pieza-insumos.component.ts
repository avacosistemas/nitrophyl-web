import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from 'app/shared/services/notification.service';
import { ABMPiezaService } from '../../abm-piezas.service';
import { IInsumoTratado, ITipoInsumoJerarquico, IAdhesivo, ITratamiento } from '../../models/pieza.model';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ABMPiezaInsumoModalFormComponent } from './modal-form/abm-pieza-insumo-modal-form.component';

@Component({
  selector: 'app-abm-pieza-insumos',
  templateUrl: './abm-pieza-insumos.component.html',
  styleUrls: ['./abm-pieza-insumos.component.scss']
})
export class ABMPiezaInsumosComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  insumosPieza = new MatTableDataSource<IInsumoTratado>([]);
  sinDatos: boolean = false;
  isLoading: boolean = false;

  displayedColumns: string[] = ['nombreInsumo', 'tipo', 'medida', 'tratamiento', 'adhesivos', 'observaciones'];

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {
    super(fb, router, route, abmPiezaService, dialog);
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    if (this.piezaId) {
      this.loadInsumosPieza();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadInsumosPieza();
    }
  }

  setDisplayedColumns(): void {
    const baseCols = ['nombreInsumo', 'tipo', 'medida', 'tratamiento', 'adhesivos', 'observaciones'];
    this.displayedColumns = this.mode === 'view' ? baseCols : [...baseCols, 'acciones'];
  }

  loadInsumosPieza(): void {
    if (!this.piezaId) return;
    this.isLoading = true;
    this.abmPiezaService.getInsumosTratadosPorPieza(this.piezaId).subscribe({
      next: (response) => {
        this.insumosPieza.data = response.data || [];
        this.sinDatos = (response.data || []).length === 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error al cargar insumos tratados:", err);
        this.notificationService.showError("Error al cargar los insumos.");
        this.isLoading = false;
      }
    });
  }

  openAddInsumoModal(insumoTratado?: IInsumoTratado): void {
    const dialogRef = this.dialog.open(ABMPiezaInsumoModalFormComponent, {
      width: '800px',
      data: {
        idPieza: this.piezaId,
        insumoTratado: insumoTratado
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInsumosPieza();
      }
    });
  }

  eliminarInsumo(insumo: IInsumoTratado): void {
    const mensaje = this.sanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el insumo <span class="font-bold">${insumo.insumo}</span>?`);

    const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.abmPiezaService.deleteInsumoTratado(insumo.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Insumo eliminado correctamente.');
            this.loadInsumosPieza();
          },
          error: (err) => {
            this.notificationService.showError('Error al eliminar el insumo.');
            console.error(err);
            this.isLoading = false;
          }
        });
      }
    });
    this.subscriptions.push(sub);
  }

  flattenTipoHierarchy(tipo: ITipoInsumoJerarquico): string {
    if (!tipo) return '-';
    const path = [];
    let current = tipo;
    while (current) {
      path.push(current.nombre);
      current = current.padre;
    }
    return path.reverse().join(' -> ');
  }

  displayAdhesivos(adhesivos: IAdhesivo[]): string {
    if (!adhesivos || adhesivos.length === 0) return '-';
    return adhesivos.map(a => a.nombre).join(', ');
  }

  displayTratamientos(tratamientos: ITratamiento[]): string {
    if (!tratamientos || tratamientos.length === 0) return '-';
    return tratamientos.map(t => t.nombre).join(', ');
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
        type: 'warning'
      }
    });
    return dialogRef.afterClosed();
  }

  openObservacionModal(observacion: string, nombreInsumo: string): void {
    this.dialog.open(GenericModalComponent, {
      width: '500px',
      data: { title: `Observaciones: ${nombreInsumo}`, message: observacion, icon: 'chat', showCloseButton: true, showConfirmButton: false, type: 'info' }
    });
  }
}