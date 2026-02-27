import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
  insumosForm: FormGroup;
  initialRequiereInsumos: boolean = false;

  displayedColumns: string[];

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
    this.initInsumosForm();
    this.setDisplayedColumns();
    if (this.piezaId) {
      this.loadInsumosPieza();
      this.loadPiezaData();
    }
  }

  private initInsumosForm(): void {
    this.insumosForm = this.fb.group({
      requiereInsumos: [{ value: false, disabled: this.mode === 'view' }],
      cantidadInsumos: [{ value: null, disabled: this.mode === 'view' }]
    });
  }

  private loadPiezaData(): void {
    this.abmPiezaService.getPieza(this.piezaId).subscribe(pieza => {
      if (pieza) {
        this.initialRequiereInsumos = !!pieza.requiereInsumos;
        this.insumosForm.patchValue({
          requiereInsumos: !!pieza.requiereInsumos,
          cantidadInsumos: pieza.cantidadInsumos
        }, { emitEvent: false });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadInsumosPieza();
    }
  }

  get requiereInsumosActivo(): boolean {
    return !!this.insumosForm?.get('requiereInsumos')?.value;
  }

  setDisplayedColumns(): void {
    const baseCols = ['nombreInsumo', 'tipo', 'unidades', 'medidaDetallada', 'tratamiento', 'adhesivos'];
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

  formatMedidaDetallada(element: IInsumoTratado): string {
    const unidadLongitud = element.unidadMedidaLongitud ? ` ${element.unidadMedidaLongitud}` : '';

    if (element.tipo?.tipoStock === 'UNIDADXMETRO' && element.medida1 != null) {
      return `${element.medida1}${unidadLongitud}`;
    }

    if (!element.unidadMedida) return '-';

    switch (element.unidadMedida) {
      case 'DIAMETRO':
        return `Diámetro: ${element.medida1}${unidadLongitud}`;
      case 'SUPERFICIE':
        return `Superficie: ${element.medida1} x ${element.medida2}${unidadLongitud}`;
      default:
        return '-';
    }
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

  hasControllingObservation(obsData: string | any[]): boolean {
    if (!obsData) return false;
    const observaciones = Array.isArray(obsData) ? obsData : (() => {
      try { return JSON.parse(obsData as string); } catch { return []; }
    })();
    return observaciones?.some(obs => obs.controlar) || false;
  }

  getObservationsCount(obsData: string | any[]): number {
    if (!obsData) return 0;
    if (Array.isArray(obsData)) return obsData.length;
    try {
      const parsed = JSON.parse(obsData as string);
      return Array.isArray(parsed) ? parsed.length : 1;
    } catch { return 1; }
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

  onRequiereInsumosChange(event: any): void {
    const newValue = event.checked;
    if (!newValue && this.initialRequiereInsumos && this.insumosPieza.data.length > 0) {
      const message = this.sanitizer.bypassSecurityTrustHtml(
        'Al desactivar "Requiere Insumos", se perderán todos los insumos cargados para esta pieza. <br><br> ¿Desea continuar?'
      );

      this.openConfirmationModal(message, 'Atención', 'Continuar', 'warning').subscribe(confirmed => {
        if (!confirmed) {
          this.insumosForm.get('requiereInsumos').setValue(true, { emitEvent: false });
        } else {
          this.initialRequiereInsumos = false;
        }
        this.abmPiezaService.events.next({ refreshButtonState: true });
      });
    } else {
      this.initialRequiereInsumos = newValue;
      this.abmPiezaService.events.next({ refreshButtonState: true });
    }
  }

  guardarCantidad(): void {
    if (this.insumosForm.invalid) return;

    this.isLoading = true;
    const data = this.insumosForm.value;
    this.abmPiezaService.updateInsumosTratadosCantidad(this.piezaId, data).subscribe({
      next: () => {
        this.notificationService.showSuccess('Datos de insumos actualizados correctamente.');
        this.isLoading = false;
        this.loadInsumosPieza();
      },
      error: (err) => {
        console.error("Error al actualizar cantidad de insumos:", err);
        this.notificationService.showError("Error al guardar los datos.");
        this.isLoading = false;
      }
    });
  }

  openConfirmationModal(message: SafeHtml, title: string = 'Confirmar eliminación', confirmText: string = 'Eliminar', type: string = 'warning'): Observable<boolean> {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: title,
        message: message,
        showConfirmButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        type: type
      }
    });
    return dialogRef.afterClosed();
  }

  openObservacionModal(obsData: string | any[], insumo: string): void {
    if (!obsData) return;

    let observaciones: any[] = [];
    if (Array.isArray(obsData)) {
      observaciones = obsData;
    } else if (typeof obsData === 'string') {
      try {
        observaciones = JSON.parse(obsData);
      } catch (e) {
        observaciones = [{ observacion: obsData, controlar: false }];
      }
    }

    if (observaciones.length === 0) return;

    let messageHtml = '<div class="flex flex-col gap-3">';
    observaciones.forEach(obs => {
      const controllingStyle = obs.controlar ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100';
      const controllingIcon = obs.controlar ? '<span class="text-amber-600 font-bold">[CONTROL]</span> ' : '';

      messageHtml += `
        <div class="p-3 border rounded-lg ${controllingStyle}">
          <p class="text-sm">${controllingIcon}${obs.observacion}</p>
        </div>
      `;
    });
    messageHtml += '</div>';

    this.dialog.open(GenericModalComponent, {
      width: '500px',
      data: {
        title: `Observaciones: ${insumo}`,
        message: this.sanitizer.bypassSecurityTrustHtml(messageHtml),
        type: 'info',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar'
      }
    });
  }
}