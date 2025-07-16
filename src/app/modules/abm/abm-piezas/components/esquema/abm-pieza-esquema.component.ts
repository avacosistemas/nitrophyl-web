import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Esquema } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ABMPiezaEsquemaModalComponent } from './modal-form/abm-pieza-esquema-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ImgModalDialogComponent } from 'app/modules/prompts/img-modal/img-modal.component';

@Component({
  selector: 'app-abm-pieza-esquema',
  templateUrl: './abm-pieza-esquema.component.html',
  styleUrls: ['./abm-pieza-esquema.component.scss']
})
export class ABMPiezaEsquemaComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  esquemas: Esquema[] = [];
  baseDisplayedColumns: string[] = ['imagen', 'tituloPasos'];
  displayedColumns: string[];
  sinDatos: boolean = false;
  isLoading: boolean = false;

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
      this.loadEsquemas();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadEsquemas();
    }
  }

  setDisplayedColumns(): void {
    this.displayedColumns = this.mode === 'view'
      ? this.baseDisplayedColumns
      : [...this.baseDisplayedColumns, 'acciones'];
  }

  loadEsquemas(): void {
    this.isLoading = true;
    const sub = this.abmPiezaService.getEsquemas(this.piezaId).subscribe({
      next: response => {
        this.esquemas = (response.data || []).map(esquema => {
          if (esquema.imagen) {
            esquema.safeImagenUrl = this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${esquema.imagen}`);
          }
          return esquema;
        });
        this.sinDatos = this.esquemas.length === 0;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error al cargar esquemas:', err);
        this.notificationService.showError('No se pudieron cargar los esquemas.');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  openEsquemaModal(esquema?: Esquema): void {
    const dialogRef = this.dialog.open(ABMPiezaEsquemaModalComponent, {
      width: '600px',
      data: {
        esquema: esquema ? { ...esquema } : null,
        idProceso: this.piezaId
      }
    });

    const sub = dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEsquemas();
      }
    });
    this.subscriptions.push(sub);
  }

  eliminarEsquema(esquema: Esquema): void {
    const mensaje = this.sanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el esquema <span class="font-bold">${esquema.titulo}</span>?`);

    const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
      if (confirmed) {
        const deleteSub = this.abmPiezaService.deleteEsquema(esquema.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Esquema eliminado correctamente.');
            this.loadEsquemas();
          },
          error: err => {
            console.error('Error al eliminar esquema:', err);
            this.notificationService.showError('Ocurrió un error al eliminar el esquema.');
          }
        });
        this.subscriptions.push(deleteSub);
      }
    });
    this.subscriptions.push(sub);
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

  openImageModal(esquema: Esquema): void {
    this.dialog.open(ImgModalDialogComponent, {
      data: {
        imgAlt: esquema.titulo,
        imgSrc: esquema.safeImagenUrl,
        imgType: 'url',
        title: esquema.titulo
      },
      width: '80%',
      maxWidth: '800px'
    });
  }
}