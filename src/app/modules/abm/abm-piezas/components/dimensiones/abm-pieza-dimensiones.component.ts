import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ABMPiezaService } from '../../abm-piezas.service';
import { PiezaDimension } from '../../models/pieza.model';
import { Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconRegistry } from '@angular/material/icon';
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

    baseDisplayedColumns: string[] = ['tipoDimension', 'valor', 'observaciones'];
    displayedColumnsDimensiones: string[];

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer
    ) {
        super(fb, router, route, abmPiezaService, dialog);

        this.dimensionForm = this.fb.group({
            tipoDimension: [null, Validators.required],
            valor: [null, Validators.required],
            observaciones: [null]
        });
    }

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
        if (this.mode === 'view') {
            this.displayedColumnsDimensiones = this.baseDisplayedColumns;
        } else {
            this.displayedColumnsDimensiones = [...this.baseDisplayedColumns, 'acciones'];
        }
    }

    loadDimensiones(): void {
        if (!this.piezaId) return;
        this.isLoading = true;
        this.subscription.add(
            this.abmPiezaService.getDimensionesPorPieza(this.piezaId).subscribe({
                next: (response: any) => {
                    const dimensiones = response && response.data ? response.data : [];
                    this.dimensiones.data = dimensiones;
                    this.sinDatos = dimensiones.length === 0;
                    this.isLoading = false;
                },
                error: (err) => {
                    this.openSnackBar('Error al cargar las dimensiones.', 'X', 'red-snackbar');
                    this.isLoading = false;
                    this.sinDatos = true;
                }
            })
        );
    }

    addOrUpdateDimension(): void {
        if (this.dimensionForm.invalid) {
            this.openSnackBar('Por favor, complete todos los campos requeridos.', 'X', 'red-snackbar');
            return;
        }

        this.isLoading = true;
        const formValue = this.dimensionForm.value;

        if (this.editMode && this.dimensionToEdit) {
            const dto = { ...formValue, idPieza: this.piezaId, id: this.dimensionToEdit.id };
            this.subscription.add(
                this.abmPiezaService.actualizarDimensionDePieza(this.dimensionToEdit.id, dto).subscribe({
                    next: () => {
                        this.openSnackBar('Dimensión actualizada correctamente.', 'X', 'green-snackbar');
                        this.cancelEdit();
                        this.loadDimensiones();
                    },
                    error: (err) => {
                        this.openSnackBar('Error al actualizar la dimensión.', 'X', 'red-snackbar');
                        this.isLoading = false;
                    }
                })
            );
        } else {
            const dto = { ...formValue, idPieza: this.piezaId };
            this.subscription.add(
                this.abmPiezaService.agregarDimensionAPieza(dto).subscribe({
                    next: () => {
                        this.openSnackBar('Dimensión agregada correctamente.', 'X', 'green-snackbar');
                        this.dimensionForm.reset();
                        this.loadDimensiones();
                    },
                    error: (err) => {
                        this.openSnackBar('Error al agregar la dimensión.', 'X', 'red-snackbar');
                        this.isLoading = false;
                    }
                })
            );
        }
    }

    eliminarDimension(row: PiezaDimension): void {
        const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar la dimensión <span class="font-bold">${row.tipoDimension}</span>?`);
        this.openConfirmationModal(mensaje, () => {
            this.isLoading = true;
            this.subscription.add(
                this.abmPiezaService.eliminarDimensionDePieza(row.id).subscribe({
                    next: () => {
                        this.openSnackBar('Dimensión eliminada correctamente.', 'X', 'green-snackbar');
                        this.loadDimensiones();
                    },
                    error: (err) => {
                        this.openSnackBar('Error al eliminar la dimensión.', 'X', 'red-snackbar');
                        this.isLoading = false;
                    }
                })
            );
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

    startEdit(dimension: PiezaDimension): void {
        this.editMode = true;
        this.dimensionToEdit = { ...dimension };
        this.dimensionForm.setValue({
            tipoDimension: dimension.tipoDimension,
            valor: dimension.valor,
            observaciones: dimension.observaciones || null
        });
    }

    cancelEdit(): void {
        this.editMode = false;
        this.dimensionToEdit = null;
        this.dimensionForm.reset();
    }

    openSnackBar(message: string, action: string, className: string, duration: number = 5000) {
        this.snackBar.open(message, action, {
            duration: duration,
            panelClass: className,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    get buttonText(): string {
        return this.editMode ? 'Actualizar' : 'Agregar';
    }
}