import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from 'app/shared/services/notification.service';
import { ABMPiezaService } from '../../abm-piezas.service';
import { PiezaDimension } from '../../models/pieza.model';
import { Observable, Subscription, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-abm-pieza-dimensiones',
    templateUrl: './abm-pieza-dimensiones.component.html',
    styleUrls: ['./abm-pieza-dimensiones.component.scss']
})
export class ABMPiezaDimensionesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
    @Input() piezaId: number;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    dimensionForm: FormGroup;
    dimensiones = new MatTableDataSource<PiezaDimension>([]);
    tiposDimension$: Observable<string[]>;
    sinDatos: boolean = false;
    isLoading: boolean = false;
    editMode: boolean = false;
    dimensionToEdit: PiezaDimension | null = null;
    private subscription: Subscription = new Subscription();

    baseDisplayedColumns: string[] = ['controlar', 'tipo', 'valor', 'minimo', 'maximo', 'observaciones', 'acciones'];
    displayedColumnsDimensiones: string[];

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

        this.dimensionForm = this.fb.group({
            tipo: [null, Validators.required],
            valor: [null, Validators.required],
            toleranciaAux: [null],
            minimo: [null],
            maximo: [null],
            observaciones: [null],
            controlar: [false]
        });

        this.dimensionForm.get('toleranciaAux')?.valueChanges.subscribe(aux => {
            if (aux !== null && aux !== '') {
                const valor = this.dimensionForm.get('valor')?.value;
                if (valor !== null && valor !== '') {
                    const auxNum = parseFloat(aux);
                    const valorNum = parseFloat(valor);
                    if (!isNaN(auxNum) && !isNaN(valorNum)) {
                        this.dimensionForm.patchValue({
                            minimo: valorNum - auxNum,
                            maximo: valorNum + auxNum
                        }, { emitEvent: false });
                    }
                }
            }
        });

        this.dimensionForm.get('minimo')?.valueChanges.subscribe(() => {
            if (this._clearingAux) return;
            this._clearingAux = true;
            this.dimensionForm.patchValue({ toleranciaAux: null }, { emitEvent: false });
            this._clearingAux = false;
        });
        this.dimensionForm.get('maximo')?.valueChanges.subscribe(() => {
            if (this._clearingAux) return;
            this._clearingAux = true;
            this.dimensionForm.patchValue({ toleranciaAux: null }, { emitEvent: false });
            this._clearingAux = false;
        });
    }

    private _clearingAux = false;

    ngOnInit(): void {
        this.setDisplayedColumns();
        this.tiposDimension$ = this.abmPiezaService.getTiposDimension();
        if (this.piezaId) {
            this.loadDimensiones();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode) {
            this.setDisplayedColumns();
            if (this.mode === 'view') {
                this.dimensionForm.disable();
            } else {
                this.dimensionForm.enable();
            }
        }
        if (changes.piezaId && changes.piezaId.currentValue) {
            this.loadDimensiones();
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    setDisplayedColumns(): void {
        const sinAcciones = this.baseDisplayedColumns.filter(c => c !== 'acciones');
        this.displayedColumnsDimensiones = this.mode === 'view'
            ? sinAcciones
            : this.baseDisplayedColumns;
    }

    loadDimensiones(): void {
        if (!this.piezaId) return;
        this.isLoading = true;
        this.subscription.add(
            this.abmPiezaService.getDimensionesPorPieza(this.piezaId).subscribe({
                next: (response) => {
                    const dimensionesData = response.data || [];
                    this.dimensiones.data = dimensionesData;
                    this.sinDatos = dimensionesData.length === 0;
                    this.isLoading = false;
                },
                error: (err) => {
                    this.notificationService.showError('Error al cargar las dimensiones.');
                    this.isLoading = false;
                    this.sinDatos = true;
                }
            })
        );
    }

    addOrUpdateDimension(): void {
        if (this.dimensionForm.invalid) {
            this.notificationService.showError('Por favor, complete todos los campos requeridos.');
            return;
        }

        this.isLoading = true;
        const { toleranciaAux, ...formValue } = this.dimensionForm.value;
        const dto = { ...formValue, idPieza: this.piezaId };

        if (this.editMode && this.dimensionToEdit) {
            this.subscription.add(
                this.abmPiezaService.actualizarDimensionDePieza(this.dimensionToEdit.id, dto).subscribe({
                    next: () => {
                        this.notificationService.showSuccess('Dimensión actualizada correctamente.');
                        this.cancelEdit();
                        this.loadDimensiones();
                    },
                    error: (err) => {
                        this.notificationService.showError('Error al actualizar la dimensión.');
                        this.isLoading = false;
                    }
                })
            );
        } else {
            this.subscription.add(
                this.abmPiezaService.agregarDimensionAPieza(dto).subscribe({
                    next: () => {
                        this.notificationService.showSuccess('Dimensión agregada correctamente.');
                        this.dimensionForm.reset({ controlar: false });
                        this.loadDimensiones();
                    },
                    error: (err) => {
                        this.notificationService.showError('Error al agregar la dimensión.');
                        this.isLoading = false;
                    }
                })
            );
        }
    }

    eliminarDimension(row: PiezaDimension): void {
        const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar la dimensión <span class="font-bold">${row.tipo}</span>?`);

        const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
            if (confirmed) {
                this.isLoading = true;
                this.subscription.add(
                    this.abmPiezaService.eliminarDimensionDePieza(row.id).subscribe({
                        next: () => {
                            this.notificationService.showSuccess('Dimensión eliminada correctamente.');
                            this.loadDimensiones();
                        },
                        error: (err) => {
                            this.notificationService.showError('Error al eliminar la dimensión.');
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
                type: 'warning'
            }
        });
        return dialogRef.afterClosed();
    }

    startEdit(dimension: PiezaDimension): void {
        this.editMode = true;
        this.dimensionToEdit = { ...dimension };
        this.dimensionForm.setValue({
            tipo: dimension.tipo,
            valor: dimension.valor,
            toleranciaAux: null,
            minimo: dimension.minimo ?? null,
            maximo: dimension.maximo ?? null,
            observaciones: dimension.observaciones || null,
            controlar: dimension.controlar ?? false
        });
    }

    cancelEdit(): void {
        this.editMode = false;
        this.dimensionToEdit = null;
        this.dimensionForm.reset({ controlar: false });
    }

    openObservacionModal(observacion: string, tipo: string): void {
        this.dialog.open(GenericModalComponent, {
            width: '500px',
            data: {
                title: `Observaciones: ${tipo}`,
                message: observacion,
                icon: 'chat',
                showCloseButton: true,
                showConfirmButton: false,
                type: 'info'
            }
        });
    }

    get buttonText(): string {
        return this.editMode ? 'Actualizar' : 'Agregar';
    }
}