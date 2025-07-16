import {
    AfterViewInit,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ABMPiezaService } from '../../abm-piezas.service';
import { PiezaProceso } from '../../models/pieza.model';
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
import { ABMPiezaMoldesComponent } from '../moldes/abm-pieza-moldes.component';
import { ABMPiezaDimensionesComponent } from '../dimensiones/abm-pieza-dimensiones.component';
import { ABMPiezaClientesComponent } from '../clientes/abm-pieza-clientes.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';


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

    @ViewChild(ABMPiezaMoldesComponent) abmPiezaMoldesComponent: ABMPiezaMoldesComponent;
    @ViewChild(ABMPiezaDimensionesComponent) abmPiezaDimensionesComponent: ABMPiezaDimensionesComponent;
    @ViewChild(ABMPiezaClientesComponent) abmPiezaClientesComponent: ABMPiezaClientesComponent;


    piezaId: number | null = null;
    mode: 'create' | 'view' | 'edit' = 'create';
    subscriptions: Subscription[] = [];
    currentTab: number = 0;
    mostrarBotonEdicion: boolean = false;
    botonEdicionTexto: string = '';
    nombrePieza: string = '';
    piezaForm: FormGroup;
    piezaProceso: PiezaProceso | null = null;

    private isNavigatingWithConfirmation: boolean = false;

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private notificationService: NotificationService,
        public dialog: MatDialog,
        private _cd: ChangeDetectorRef
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
                } else {
                    this.nombrePieza = '';
                    this.actualizarEstadoBotones();
                }
            }),

            this.abmPiezaService.actionEvents$.subscribe(() => {
                this.ejecutarAccionPrincipal();
            }),

            this.abmPiezaService.buttonState$.subscribe(state => {
                if (state && state.nombrePieza) {
                    this.nombrePieza = state.nombrePieza;
                }
            })
        );
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            if (this.abmPiezaCrearEditarComponent) {
                this.piezaForm = this.abmPiezaCrearEditarComponent.piezaForm;
            }
            this.actualizarEstadoBotones();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private isAnyFormDirty(): boolean {
        const formsToCheck = [
            this.abmPiezaCrearEditarComponent?.piezaForm,
            this.abmPiezaMoldesComponent?.moldeForm,
            this.abmPiezaClientesComponent?.clienteForm,
            this.abmPiezaDimensionesComponent?.dimensionForm,
            this.abmPiezaMoldeoComponent?.moldeoForm,
            this.abmPiezaDesmoldantePostcuraComponent?.form,
            this.abmPiezaFinalizacionComponent?.form
        ];
        return formsToCheck.some(form => form?.dirty);
    }

    private markAllFormsPristine(): void {
        this.abmPiezaCrearEditarComponent?.piezaForm?.markAsPristine();
        this.abmPiezaMoldesComponent?.moldeForm?.markAsPristine();
        this.abmPiezaClientesComponent?.clienteForm?.markAsPristine();
        this.abmPiezaDimensionesComponent?.dimensionForm?.markAsPristine();
        this.abmPiezaMoldeoComponent?.moldeoForm?.markAsPristine();
        this.abmPiezaDesmoldantePostcuraComponent?.form?.markAsPristine();
        this.abmPiezaFinalizacionComponent?.form?.markAsPristine();
    }

    tabChange(event: MatTabChangeEvent): void {
        const nextIndex = event.index;
        const previousIndex = this.currentTab;

        if (this.isNavigatingWithConfirmation || previousIndex === nextIndex) {
            this.isNavigatingWithConfirmation = false;
            return;
        }

        if (this.isAnyFormDirty()) {
            setTimeout(() => {
                this.tabGroup.selectedIndex = previousIndex;
            }, 0);

            const dialogRef = this.dialog.open(GenericModalComponent, {
                width: '450px',
                data: {
                    title: 'Cambios sin guardar',
                    message: 'Tienes cambios sin guardar. ¿Deseas continuar y descartarlos?',
                    showConfirmButton: true,
                    confirmButtonText: 'Continuar',
                    cancelButtonText: 'Cancelar',
                    type: 'warning'
                }
            });

            dialogRef.afterClosed().subscribe(confirmed => {
                if (confirmed) {
                    this.markAllFormsPristine();
                    this.currentTab = nextIndex;
                    this.isNavigatingWithConfirmation = true;
                    this.tabGroup.selectedIndex = nextIndex;
                    this._cd.detectChanges();
                    this.actualizarEstadoBotones();
                }
            });
        } else {
            this.currentTab = nextIndex;
            this.actualizarEstadoBotones();
        }
    }


    actualizarEstadoBotones(): void {
        this.mostrarBotonEdicion = false;
        this.botonEdicionTexto = '';

        if (this.mode !== 'view') {
            switch (this.currentTab) {
                case 0:
                    this.mostrarBotonEdicion = true;
                    this.botonEdicionTexto = this.mode === 'create' ? 'Crear Pieza' : 'Guardar Pieza';
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
        this.abmPiezaService.getByIdEdicion(id).subscribe({
            next: (pieza) => {
                if (pieza) {
                    this.piezaProceso = pieza;
                    this.nombrePieza = pieza.denominacion;
                    this.actualizarEstadoBotones();
                } else {
                    this.notificationService.showError(`No se encontró la pieza con ID: ${id}`);
                }
            },
            error: (error) => {
                console.error('Error al cargar los datos de la pieza:', error);
                this.notificationService.showError('Error al cargar los datos de la pieza.');
            }
        });
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
                piezaId: this.piezaId,
                serviceUpload: (dto) => {
                    const payload = { ...dto, idPieza: this.piezaId };
                    return this.abmPiezaService.uploadPlano(payload);
                }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && this.abmPiezaPlanosComponent) {
                this.abmPiezaPlanosComponent.loadPlanos();
            }
        });
    }
}