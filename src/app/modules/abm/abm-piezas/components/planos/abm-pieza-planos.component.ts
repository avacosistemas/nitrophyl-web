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
import { MatIconRegistry } from '@angular/material/icon';
import * as FileSaver from 'file-saver';
import { PDFModalDialogComponent } from 'app/modules/prompts/pdf-modal/pdf-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-abm-pieza-planos',
    templateUrl: './abm-pieza-planos.component.html',
    styleUrls: ['./abm-pieza-planos.component.scss']
})
export class ABMPiezaPlanosComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
    @Input() piezaId: number;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    planos = new MatTableDataSource<Plano>([]);
    baseDisplayedColumnsPlanos: string[] = ['nombre', 'clasificacion', 'descripcion', 'version', 'fecha'];
    displayedColumnsPlanos: string[];
    private planoSubscription: Subscription;
    sinDatos: boolean = false;

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        private matIconRegistry: MatIconRegistry
    ) {
        super(fb, router, route, abmPiezaService, dialog);
        this.form = this.fb.group({});

        this.matIconRegistry.addSvgIcon(
            "heroicons_solid:eye",
            this.domSanitizer.bypassSecurityTrustResourceUrl("assets/icons/heroicons_solid/eye.svg")
        );
        this.matIconRegistry.addSvgIcon(
            "heroicons_solid:download",
            this.domSanitizer.bypassSecurityTrustResourceUrl("assets/icons/heroicons_solid/download.svg")
        );
        this.matIconRegistry.addSvgIcon(
            "heroicons_outline:trash",
            this.domSanitizer.bypassSecurityTrustResourceUrl("assets/icons/heroicons_outline/trash.svg")
        );
    }

    ngOnInit(): void {
        this.setDisplayedColumns();
        this.loadPlanos();

        this.subscriptions.push(
            this.abmPiezaService.events.subscribe(event => {
                if (event === 'planoSubido') {
                    this.loadPlanos();
                }
            })
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode) {
            this.setDisplayedColumns();
        }
    }

    ngOnDestroy(): void {
        if (this.planoSubscription) {
            this.planoSubscription.unsubscribe();
        }
    }

    setDisplayedColumns(): void {
        if (this.mode === 'view') {
            this.displayedColumnsPlanos = this.baseDisplayedColumnsPlanos;
        } else {
            this.displayedColumnsPlanos = [...this.baseDisplayedColumnsPlanos, 'acciones'];
        }
    }

    loadPlanos(): void {
        if (this.piezaId) {
            this.planoSubscription = this.abmPiezaService.getPlanos(this.piezaId).subscribe(planos => {
                this.planos.data = planos;
                this.sinDatos = this.planos.data.length === 0;
            });
        } else {
            this.sinDatos = true;
            this.planos.data = [];
        }
    }

    public openPlano(plano: Plano): void {
        this.abmPiezaService.downloadPlano(plano.id).subscribe({
            next: (response: any) => {
                const base64Content = response?.data?.archivo;

                if (!base64Content) {
                    console.error('No se recibió un string Base64 válido del backend.');
                    this.openSnackBar(false, 'Error al obtener el plano', 'red');
                    return;
                }

                this.dialog.open(PDFModalDialogComponent, {
                    maxWidth: '75%',
                    width: '80vw',
                    height: '90vh',
                    data: {
                        src: base64Content,
                        title: plano.nombreArchivo,
                        showDownloadButton: true
                    },
                });

            },
            error: (error) => {
                console.error('Error al descargar el plano:', error);
                this.openSnackBar(false, 'Error al obtener el plano', 'red');
            }
        });
    }

    public downloadPlano(plano: Plano): void {
        this.abmPiezaService.downloadPlano(plano.id).subscribe((response: any) => {
            if (response?.status === 'OK' && response?.data?.archivo) {
                const byteCharacters = atob(response.data.archivo);
                const byteArrays = [];

                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                    const slice = byteCharacters.slice(offset, offset + 512);
                    const byteNumbers = new Array(slice.length);

                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }

                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }

                const blob = new Blob(byteArrays, { type: 'application/pdf' });
                FileSaver.saveAs(blob, plano.nombreArchivo);
            } else {
                console.error('No se recibió un string Base64 válido del backend.');
                this.openSnackBar(false, 'Error al descargar el plano', 'red');
            }
        });
    }

    eliminarPlano(plano: Plano): void {
        const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el plano <span class="font-bold">${plano.nombreArchivo}</span>?`);
        this.openConfirmationModal(mensaje, () => {
            const data = this.planos.data;
            data.splice(data.indexOf(plano), 1);
            this.planos.data = data;
            this.sinDatos = this.planos.data.length === 0;
            this.openSnackBar(true, 'Plano eliminado (mock).', 'green');
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