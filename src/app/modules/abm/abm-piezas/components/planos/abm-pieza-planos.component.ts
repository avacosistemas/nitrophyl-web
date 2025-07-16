import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatTableDataSource } from '@angular/material/table';
import { Plano } from '../../models/pieza.model';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as FileSaver from 'file-saver';
import { PDFModalDialogComponent } from 'app/modules/prompts/pdf-modal/pdf-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { ABMPiezaPlanoModalComponent } from './modal-plano/abm-pieza-plano-modal.component';

@Component({
    selector: 'app-abm-pieza-planos',
    templateUrl: './abm-pieza-planos.component.html',
    styleUrls: ['./abm-pieza-planos.component.scss']
})
export class ABMPiezaPlanosComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
    @Input() piezaId: number;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    planos = new MatTableDataSource<Plano>([]);

    baseDisplayedColumns: string[] = ['codigo', 'revision', 'clasificacion', 'observaciones', 'fecha'];
    displayedColumnsPlanos: string[];

    sinDatos: boolean = false;
    isLoading: boolean = false;

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private domSanitizer: DomSanitizer,
    ) {
        super(fb, router, route, abmPiezaService, dialog);
    }

    ngOnInit(): void {
        this.setDisplayedColumns();
        if (this.piezaId) {
            this.loadPlanos();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode) {
            this.setDisplayedColumns();
        }
        if (changes.piezaId && changes.piezaId.currentValue) {
            this.loadPlanos();
        }
    }

    setDisplayedColumns(): void {
        this.displayedColumnsPlanos = this.mode === 'view'
            ? this.baseDisplayedColumns
            : [...this.baseDisplayedColumns, 'acciones'];
    }

    loadPlanos(): void {
        if (!this.piezaId) return;

        this.isLoading = true;
        const sub = this.abmPiezaService.getPlanos(this.piezaId).subscribe({
            next: response => {
                this.planos.data = response.data || [];
                this.sinDatos = (response.data || []).length === 0;
                this.isLoading = false;
            },
            error: err => {
                this.notificationService.showError('Error al cargar los planos.');
                console.error(err);
                this.isLoading = false;
            }
        });
        this.subscriptions.push(sub);
    }

    openPlanoUploadModal(): void {
        const dialogRef = this.dialog.open(ABMPiezaPlanoModalComponent, {
            width: '600px',
            data: {
                title: 'Subir Nuevo Plano',
                piezaId: this.piezaId,
            }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadPlanos();
            }
        });
        this.subscriptions.push(sub);
    }

    public openPlano(plano: Plano): void {
        const sub = this.abmPiezaService.downloadPlano(plano.id).subscribe({
            next: (response) => {
                if (response.data && response.data.archivo) {
                    const base64Pdf = response.data.archivo;
                    this.dialog.open(PDFModalDialogComponent, {
                        width: '80vw', height: '90vh',
                        data: { src: base64Pdf, title: response.data.nombre || 'Plano', showDownloadButton: true },
                    });
                } else {
                    this.notificationService.showError('El plano no tiene contenido para mostrar.');
                }
            },
            error: (err) => {
                this.notificationService.showError('Error al obtener el plano para visualizar.');
                console.error(err);
            }
        });
        this.subscriptions.push(sub);
    }

    public downloadPlano(plano: Plano): void {
        const sub = this.abmPiezaService.downloadPlano(plano.id).subscribe({
            next: (response) => {
                if (response.data && response.data.archivo) {
                    const byteCharacters = atob(response.data.archivo);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    FileSaver.saveAs(blob, response.data.nombre || `plano-${plano.id}.pdf`);
                } else {
                    this.notificationService.showError('El plano está vacío y no se puede descargar.');
                }
            },
            error: (err) => {
                this.notificationService.showError('Error al descargar el plano.');
                console.error(err);
            }
        });
        this.subscriptions.push(sub);
    }

    eliminarPlano(plano: Plano): void {
        const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el plano <span class="font-bold">${plano.codigo} (Rev. ${plano.revision})</span>?`);
        this.openConfirmationModal(mensaje, () => {
            const sub = this.abmPiezaService.deletePlano(plano.id).subscribe({
                next: () => {
                    this.notificationService.showSuccess('Plano eliminado correctamente.');
                    this.loadPlanos();
                },
                error: err => {
                    this.notificationService.showError('Error al eliminar el plano.');
                    console.error(err);
                }
            });
            this.subscriptions.push(sub);
        });
    }

    openObservacionModal(observacion: string, codigo: string): void {
        this.dialog.open(GenericModalComponent, {
            width: '500px',
            data: {
                title: `Observaciones: ${codigo}`,
                message: observacion,
                icon: 'chat',
                showCloseButton: true,
                showConfirmButton: false,
                type: 'info'
            }
        });
    }

    openConfirmationModal(message: SafeHtml, onConfirm: () => void): void {
        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Confirmar eliminación',
                message,
                showConfirmButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                onConfirm();
            }
        });
        this.subscriptions.push(sub);
    }
}