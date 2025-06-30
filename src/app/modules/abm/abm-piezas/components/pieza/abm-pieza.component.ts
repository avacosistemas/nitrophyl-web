import {
    AfterViewInit,
    Component,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ABMPiezaService } from '../../abm-piezas.service';
import { Pieza } from '../../models/pieza.model';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { ABMPiezaPlanoModalComponent } from 'app/modules/abm/abm-piezas/components/planos/modal-plano/abm-pieza-plano-modal.component';
import { ABMPiezaPlanosComponent } from '../planos/abm-pieza-planos.component';
import { ABMPiezaCrearEditarComponent } from '../crear-editar/abm-pieza-crear-editar.component';
import { ABMPiezaMoldeoComponent } from '../moldeo/abm-pieza-moldeo.component';
import { ABMPiezaInsumosComponent } from '../insumos/abm-pieza-insumos.component';
import { ABMPiezaEsquemaComponent } from '../esquema/abm-pieza-esquema.component';
import { ABMPiezaDesmoldantePostcuraComponent } from '../desmoldante-postcura/abm-pieza-desmoldante-postcura.component';
import { ABMPiezaFinalizacionComponent } from '../finalizacion/abm-pieza-finalizacion.component';

@Component({
    selector: 'app-abm-pieza',
    templateUrl: './abm-pieza.component.html',
    styleUrls: ['./abm-pieza.component.scss']
})
export class ABMPiezaComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    @ViewChild(ABMPiezaCrearEditarComponent) abmPiezaCrearEditarComponent: ABMPiezaCrearEditarComponent;
    @ViewChild(ABMPiezaPlanosComponent) abmPiezaPlanosComponent: ABMPiezaPlanosComponent;
    @ViewChild(ABMPiezaInsumosComponent) abmPiezaInsumosComponent: ABMPiezaInsumosComponent;
    @ViewChild(ABMPiezaMoldeoComponent) abmPiezaMoldeoComponent: ABMPiezaMoldeoComponent;
    @ViewChild(ABMPiezaDesmoldantePostcuraComponent) abmPiezaDesmoldantePostcuraComponent: ABMPiezaDesmoldantePostcuraComponent;
    @ViewChild(ABMPiezaEsquemaComponent) abmPiezaEsquemaComponent: ABMPiezaEsquemaComponent;
    @ViewChild(ABMPiezaFinalizacionComponent) abmPiezaFinalizacionComponent: ABMPiezaFinalizacionComponent;

    piezaId: number | null = null;
    mode: 'create' | 'view' | 'edit' = 'create';
    subscriptions: Subscription[] = [];
    currentTab: number = 0;
    mostrarBotonEdicion: boolean = false;
    botonEdicionTexto: string = '';
    nombrePieza: string = '';

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog,
    ) {
        super(fb, router, route, abmPiezaService, dialog);
    }

    ngOnInit(): void {
        this.subscriptions.push(
            this.route.params.subscribe(params => {
                this.piezaId = params['id'] ? +params['id'] : null;
                this.mode = this.route.snapshot.data['mode'];
                if (this.piezaId) {
                    this.loadPiezaData(this.piezaId);
                }
            }),

            this.abmPiezaService.events.subscribe(event => {
                if (event && event.type === 'ejecutarAccion') {
                    this.ejecutarAccionPrincipal();
                }
                if (event && event.type === 'piezaGuardada') {
                    this.openSnackBar(true, 'Pieza guardada correctamente.', 'green');
                    this.nombrePieza = event.nombrePieza;
                    this.actualizarEstadoBotones();
                }
            })
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.piezaForm = this.abmPiezaCrearEditarComponent.piezaForm;
            this.actualizarEstadoBotones();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    tabChange(event: MatTabChangeEvent): void {
        this.currentTab = event.index;
        this.actualizarEstadoBotones();
    }

    actualizarEstadoBotones(): void {
        this.mostrarBotonEdicion = false;
        this.botonEdicionTexto = '';

        if (this.mode !== 'view') {
            switch (this.currentTab) {
                case 0:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Guardar Pieza';
                    break;
                case 2:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Añadir Insumo';
                    break;
                case 3:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Guardar Moldeo';
                    break;
                case 4:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Guardar Desmoldante/Postcura';
                    break;
                case 5:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Añadir Esquema';
                    break;
                case 6:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Guardar Finalización';
                    break;
                case 9:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Subir Plano';
                    break;
            }
        }

        this.abmPiezaService.updateButtonState({
            mostrarBotonEdicion: this.mostrarBotonEdicion,
            botonEdicionTexto: this.botonEdicionTexto,
            nombrePieza: this.nombrePieza
        });
    }

    ejecutarAccionPrincipal(): void {
        switch (this.currentTab) {
            case 0:
                if (this.abmPiezaCrearEditarComponent) {
                    this.abmPiezaCrearEditarComponent.guardarPieza();
                }
                break;
            case 2:
                this.abrirModalAgregarInsumo();
                break;
            case 3:
                this.onGuardarMoldeo();
                break;
            case 4:
                this.onGuardarDesmoldantePostcura();
                break;
            case 5:
                this.abrirModalAgregarEsquema();
                break;
            case 6:
                this.onGuardarFinalizacion();
                break;
            case 9:
                this.abrirModalSubirPlano();
                break;
        }
    }

    private loadPiezaData(id: number): void {
        this.abmPiezaService.getPieza(id).subscribe({
            next: (pieza: Pieza) => {
                if (pieza) {
                    this.nombrePieza = pieza.denominacion;
                    this.actualizarEstadoBotones();
                } else {
                    this.openSnackBar(false, `No se encontró la pieza con ID: ${id}`);
                }
            },
            error: (error) => {
                console.error('Error al cargar los datos de la pieza:', error);
                this.openSnackBar(false, 'Error al cargar los datos de la pieza.');
            }
        });
    }

    onGuardarPieza(): void {
        if (this.abmPiezaCrearEditarComponent) {
            this.abmPiezaCrearEditarComponent.guardarPieza();
        }
    }

    onGuardarMoldeo(): void {
        if (this.abmPiezaMoldeoComponent) {
            this.abmPiezaMoldeoComponent.guardarMoldeo();
        }
    }

    onGuardarDesmoldantePostcura(): void {
        if (this.abmPiezaDesmoldantePostcuraComponent) {
            this.abmPiezaDesmoldantePostcuraComponent.guardar();
        }
    }

    onGuardarFinalizacion(): void {
        if (this.abmPiezaFinalizacionComponent) {
            this.abmPiezaFinalizacionComponent.guardar();
        }
    }

    abrirModalAgregarInsumo(): void {
        if (this.abmPiezaInsumosComponent) {
            this.abmPiezaInsumosComponent.openAddInsumoModal();
        }
    }

    abrirModalAgregarEsquema(): void {
        if (this.abmPiezaEsquemaComponent) {
            this.abmPiezaEsquemaComponent.openEsquemaModal();
        }
    }

    abrirModalSubirPlano(): void {
        const dialogRef = this.dialog.open(ABMPiezaPlanoModalComponent, {
            width: '600px',
            data: {
                title: 'Subir Plano',
                fileTypeDescription: 'Plano PDF',
                acceptFileTypes: '.pdf',
                showClassification: true,
                clasificacionOptions: [
                    { value: 'NITROPHYL', label: 'Nitrophyl' },
                    { value: 'CLIENTE', label: 'Cliente' }
                ],
                serviceUpload: (dto) => {
                    const payload = { ...dto, idPieza: this.piezaId };
                    return this.abmPiezaService.uploadPlano(payload);
                }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.openSnackBar(true, 'Plano subido correctamente.', 'green');
                if (this.abmPiezaPlanosComponent) {
                    this.abmPiezaPlanosComponent.loadPlanos();
                }
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