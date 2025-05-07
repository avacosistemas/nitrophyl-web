import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ABMPiezaService } from '../../abm-piezas.service';
import { Dimension } from '../../models/pieza.model';
import { Observable, Subject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
    dimensiones = new MatTableDataSource<Dimension>([]);
    tiposDimension$: Observable<string[]>;
    sinDatos: boolean = false;

    baseDisplayedColumns: string[] = ['dimension', 'valor'];
    displayedColumnsDimensiones: string[];

    private dimensionValueChanges = new Subject<{ dimension: Dimension, newValue: any }>();
    private dimensionValueChangesSubscription: Subscription;

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
            valor: [null, Validators.required]
        });
    }

    ngOnInit(): void {
        this.tiposDimension$ = this.abmPiezaService.getTiposDimension();
        this.setDisplayedColumns();
        this.loadDimensiones();

        this.dimensionValueChangesSubscription = this.dimensionValueChanges.pipe(
            debounceTime(1000),
            distinctUntilChanged((a, b) => a.dimension.tipoDimension === b.dimension.tipoDimension && a.newValue === b.newValue)
        ).subscribe(({ dimension, newValue }) => {
            this.updateDimensionValue(dimension, newValue);
        });
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
    }

    ngOnDestroy(): void {
        if (this.dimensionValueChangesSubscription) {
            this.dimensionValueChangesSubscription.unsubscribe();
        }
    }

    setDisplayedColumns(): void {
        if (this.mode === 'view') {
            this.displayedColumnsDimensiones = this.baseDisplayedColumns;
        } else {
            this.displayedColumnsDimensiones = [...this.baseDisplayedColumns, 'acciones'];
        }
    }

    loadDimensiones(): void {
        if (this.piezaId) {
            this.abmPiezaService.getDimensiones(this.piezaId).subscribe(dimensiones => {
                this.dimensiones = new MatTableDataSource<Dimension>(dimensiones);
                this.sinDatos = this.dimensiones.data.length === 0;
            });
        } else {
            this.sinDatos = true;
            this.dimensiones = new MatTableDataSource<Dimension>([]);
        }
    }

    addDimension(): void {
        if (this.dimensionForm.valid) {
            const newDimension: Dimension = {
                tipoDimension: this.dimensionForm.get('tipoDimension').value,
                valor: this.dimensionForm.get('valor').value
            };

            const data = this.dimensiones.data;
            data.push(newDimension);
            this.dimensiones.data = data;
            this.sinDatos = false;

            this.dimensionForm.reset();
            this.openSnackBar('Dimensión agregada (mock).', 'X', 'green-snackbar');
            this.loadDimensiones();

        } else {
            this.openSnackBar('Por favor, complete todos los campos.', 'X', 'red-snackbar');
        }
    }

    eliminarDimension(row: Dimension): void {
        const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar la dimensión <span class="font-bold">${row.tipoDimension}</span>?`);
        this.openConfirmationModal(mensaje, () => {
            const data = this.dimensiones.data;
            data.splice(data.indexOf(row), 1);
            this.dimensiones.data = data;
            this.sinDatos = this.dimensiones.data.length === 0;
            this.openSnackBar('Dimensión eliminada (mock).', 'X', 'green-snackbar');
            this.loadDimensiones();
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

    onDimensionValueChanged(element: Dimension, value: any) {
        this.dimensionValueChanges.next({ dimension: element, newValue: value });
    }

    updateDimensionValue(dimension: Dimension, newValue: any) {
        const data = this.dimensiones.data;
        const index = data.findIndex(d => d.tipoDimension === dimension.tipoDimension);

        if (index > -1) {
            data[index] = { ...dimension, valor: newValue };
            this.dimensiones.data = data;

            this.openSnackBar(`Dimensión ${dimension.tipoDimension} actualizada (mock).`, 'X', 'green-snackbar');
            this.loadDimensiones();
        }
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    }
}