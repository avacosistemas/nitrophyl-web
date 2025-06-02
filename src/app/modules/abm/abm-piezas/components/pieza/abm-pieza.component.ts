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
import { ABMPiezaMoldesComponent } from '../moldes/abm-pieza-moldes.component';

@Component({
    selector: 'app-abm-pieza',
    templateUrl: './abm-pieza.component.html',
    styleUrls: ['./abm-pieza.component.scss']
})
export class ABMPiezaComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    @ViewChild(ABMPiezaCrearEditarComponent) abmPiezaCrearEditarComponent: ABMPiezaCrearEditarComponent;
    @ViewChild(ABMPiezaPlanosComponent) abmPiezaPlanosComponent: ABMPiezaPlanosComponent;
    @ViewChild(ABMPiezaMoldeoComponent) abmPiezaMoldeoComponent: ABMPiezaMoldeoComponent;
    @ViewChild(ABMPiezaInsumosComponent) abmPiezaInsumos: ABMPiezaInsumosComponent;
    @ViewChild(ABMPiezaEsquemaComponent) abmPiezaEsquemaComponent: ABMPiezaEsquemaComponent;
    @ViewChild(ABMPiezaMoldesComponent) abmPiezaMoldesComponent: ABMPiezaMoldesComponent;

    piezaId: number | null = null;
    mode: 'create' | 'view' | 'edit' = 'create';

    subscriptions: Subscription[] = [];
    currentTab: number = 0;
    mostrarBotonEdicion: boolean = false;
    botonEdicionTexto: string = 'Guardar Pieza';
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
                if (event === 'piezaGuardada') {
                    this.openSnackBar(true, 'Pieza guardada correctamente.', 'green');
                } else if (event === 'ejecutarAccion') {
                    if (this.botonEdicionTexto === 'Subir Plano') {
                        this.abrirModalSubirPlano();
                    } else if (this.botonEdicionTexto === 'Guardar Pieza') {
                        this.onGuardarPieza();
                    } else if (this.botonEdicionTexto === 'Guardar Moldeo') {
                        this.onGuardarMoldeo();
                    } else if (this.botonEdicionTexto === 'Guardar Desmoldante/Postcura') {
                        this.onGuardarDesmoldantePostcura();
                    } else if (this.botonEdicionTexto === 'Guardar Finalización') {
                        this.onGuardarFinalizacion();
                    } else if (this.botonEdicionTexto === 'Añadir Insumo') {
                        this.abrirModalAgregarInsumo();
                    } else if (this.botonEdicionTexto === 'Añadir Esquema') {
                        this.abrirModalAgregarEsquema();
                    }

                    this.actualizarEstadoBotones();
                }
            })
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.updateViewEvents();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    tabChange(event: MatTabChangeEvent): void {
        this.currentTab = event.index;
        this.updateViewEvents();
    }

    updateViewEvents(): void {
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
                    this.botonEdicionTexto = 'Guardar Pieza Terminada';
                    break;
                case 9:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = 'Subir Plano';
                    break;
                default:
                    break;
            }
        }

        this.abmPiezaService.updateButtonState({
            mostrarBotonEdicion: this.mostrarBotonEdicion,
            botonEdicionTexto: this.botonEdicionTexto,
            nombrePieza: this.nombrePieza
        });
    }

    private loadPiezaData(id: number): void {
        this.abmPiezaService.getPieza(id).subscribe(
            (pieza: Pieza) => {
                if (pieza) {
                    this.nombrePieza = pieza.nombre;
                    this.actualizarEstadoBotones();
                } else {
                    console.warn(`No se encontró la pieza con ID: ${id}`);
                }
            },
            (error) => {
                console.error('Error al cargar los datos de la pieza:', error);
            }
        );
    }

    onGuardarPieza() {
        if (this.abmPiezaCrearEditarComponent) {
            this.abmPiezaCrearEditarComponent.guardarPieza();

            if (this.abmPiezaCrearEditarComponent.piezaForm) {
                this.nombrePieza = this.abmPiezaCrearEditarComponent.piezaForm.get('nombre').value;
                this.actualizarEstadoBotones();
            }
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
                serviceUpload: (
                    archivo: string,
                    nombreArchivo: string,
                    descripcion: string,
                    clasificacion: string,
                    codigo: string,
                    revision: number
                ) => {
                    return this.abmPiezaService.uploadPlano(
                        this.piezaId,
                        archivo,
                        nombreArchivo,
                        descripcion,
                        clasificacion,
                        codigo,
                        revision
                    );
                }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.openSnackBar(true, 'Plano subido correctamente.', 'green');

                if (this.abmPiezaPlanosComponent && this.abmPiezaPlanosComponent.loadPlanos) {
                    this.abmPiezaPlanosComponent.loadPlanos();
                }

                this.actualizarEstadoBotones();
            }
        });
    }

    onGuardarMoldeo(): void {
        this.openSnackBar(true, 'Moldeo guardado correctamente.', 'green');
        this.actualizarEstadoBotones();
    }

    onGuardarDesmoldantePostcura(): void {
        this.openSnackBar(true, 'Desmoldante/Postcura guardado correctamente.', 'green');
        this.actualizarEstadoBotones();
    }

    onGuardarFinalizacion(): void {
        this.openSnackBar(true, 'Finalización guardada correctamente.', 'green');
        this.actualizarEstadoBotones();
    }

    abrirModalAgregarInsumo(): void {
        if (this.currentTab === 1) {
            const insumosComponent = this.findInsumosComponent();
            if (insumosComponent) {
                insumosComponent.openAddInsumoModal();
            } else {
                console.warn('Componente ABMPiezaInsumosComponent no encontrado.');
            }
        }
    }

    private findInsumosComponent(): any {
        return this.abmPiezaInsumos;
    }

    abrirModalAgregarEsquema(): void {
        if (this.currentTab === 4) {
            const esquemaComponent = this.findEsquemaComponent();
            if (esquemaComponent) {
                esquemaComponent.openEsquemaModal();
            } else {
                console.warn('Componente ABMPiezaEsquemaComponent no encontrado.');
            }
        }
    }

    private findEsquemaComponent(): ABMPiezaEsquemaComponent | undefined {
        return this.abmPiezaEsquemaComponent;
    }

    private findMoldesComponent(): ABMPiezaMoldesComponent | undefined {
        return this.abmPiezaMoldesComponent;
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