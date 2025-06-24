import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    baseDisplayedColumnsPlanos: string[] = ['codigo', 'revision', 'clasificacion', 'descripcion', 'fecha'];
    displayedColumnsPlanos: string[];
    sinDatos: boolean = false;
    subscriptions: Subscription[] = [];

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
    ) {
        super(fb, router, route, abmPiezaService, dialog);
    }

    ngOnInit(): void {
        this.setDisplayedColumns();
        this.loadPlanos();

        const serviceEventSub = this.abmPiezaService.events.subscribe(event => {
            if (event === 'planoSubido') {
                this.loadPlanos();
            }
        });
        this.subscriptions.push(serviceEventSub);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode) {
            this.setDisplayedColumns();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    setDisplayedColumns(): void {
        const actions = this.mode === 'view' ? [] : ['acciones'];
        this.displayedColumnsPlanos = [...this.baseDisplayedColumnsPlanos, ...actions];
    }

    loadPlanos(): void {
        if (!this.piezaId) {
            this.sinDatos = true;
            this.planos.data = [];
            return;
        }

        const sub = this.abmPiezaService.getPlanos(this.piezaId).subscribe({
            next: planos => {
                this.planos.data = planos;
                this.sinDatos = planos.length === 0;
            },
            error: err => {
                this.openSnackBar(false, 'Error al cargar los planos.');
                console.error(err);
            }
        });
        this.subscriptions.push(sub);
    }

    openPlanoUploadModal(): void {
        const dialogRef = this.dialog.open(ABMPiezaPlanoModalComponent, {
            width: '600px',
            data: {
                title: 'Subir Nuevo Plano',
                fileTypeDescription: 'Plano (PDF)',
                acceptFileTypes: '.pdf',
                showClassification: true,
                clasificacionOptions: [
                    { value: 'NITROPHYL', label: 'NITROPHYL' },
                    { value: 'CLIENTE', label: 'CLIENTE' }
                ],
                serviceUpload: (dto) => this.abmPiezaService.uploadPlano({ ...dto, idPieza: this.piezaId })
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
            next: (blob: Blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                    this.dialog.open(PDFModalDialogComponent, {
                        maxWidth: '75%',
                        width: '80vw',
                        height: '90vh',
                        data: {
                            src: reader.result as string,
                            title: plano.nombreArchivo,
                            showDownloadButton: true
                        },
                    });
                };
                reader.readAsDataURL(blob);
            },
            error: (err) => {
                this.openSnackBar(false, 'Error al obtener el plano para visualizar.');
                console.error(err);
            }
        });
        this.subscriptions.push(sub);
    }

    public downloadPlano(plano: Plano): void {
        const sub = this.abmPiezaService.downloadPlano(plano.id).subscribe({
            next: (blob) => {
                FileSaver.saveAs(blob, plano.nombreArchivo);
            },
            error: (err) => {
                this.openSnackBar(false, 'Error al descargar el plano.');
                console.error(err);
            }
        });
        this.subscriptions.push(sub);
    }

    eliminarPlano(plano: Plano): void {
        const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el plano <span class="font-bold">${plano.nombreArchivo}</span>?`);
        this.openConfirmationModal(mensaje, () => {
            const sub = this.abmPiezaService.deletePlano(plano.id).subscribe({
                next: () => {
                    this.openSnackBar(true, 'Plano eliminado correctamente.');
                    this.loadPlanos();
                },
                error: err => {
                    this.openSnackBar(false, 'Error al eliminar el plano.');
                    console.error(err);
                }
            });
            this.subscriptions.push(sub);
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

    openObservacionModal(observacion: string, nombreArchivo: string): void {
        this.dialog.open(GenericModalComponent, {
            width: '500px',
            data: {
                title: `Observaciones: ${nombreArchivo}`,
                message: observacion,
                icon: 'chat',
                showCloseButton: true,
                showConfirmButton: false,
                type: 'info',
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