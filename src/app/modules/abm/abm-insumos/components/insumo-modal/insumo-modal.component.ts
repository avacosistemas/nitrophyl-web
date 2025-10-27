import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { AbmInsumosService } from '../../abm-insumos.service';
import { IInsumo } from '../../models/insumo.interface';
import { ITipoInsumo } from '../../models/tipo-insumo.interface';
import { IMateriaPrima } from '../../models/materia-prima.interface';

interface DialogData {
    mode: 'create' | 'edit';
    insumo?: IInsumo;
}

@Component({
    selector: 'app-insumo-modal',
    templateUrl: './insumo-modal.component.html'
})
export class InsumoModalComponent implements OnInit, OnDestroy {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;

    allTiposInsumo: ITipoInsumo[] = [];
    filteredTiposInsumo$: Observable<ITipoInsumo[]>;

    allMateriasPrimas: IMateriaPrima[] = [];
    filteredMateriasPrimas$: Observable<IMateriaPrima[]>;
    selectedMateriaPrima: IMateriaPrima | null = null;

    private subscriptions = new Subscription();

    constructor(
        public dialogRef: MatDialogRef<InsumoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmInsumosService: AbmInsumosService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Insumo' : 'Editar Insumo';
    }

    ngOnInit(): void {
        this.initForm();
        this.loadInitialData();
        this.setupDynamicValidators();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            tipoInsumo: [null, Validators.required],
            materiaPrima: [null],
            cantidadMateriaPrima: [null]
        });
    }

    private loadInitialData(): void {
        this.isLoading = true;
        const sub = forkJoin({
            tipos: this.abmInsumosService.getTiposInsumo(),
            materiasPrimas: this.abmInsumosService.getMateriasPrimas()
        }).subscribe({
            next: ({ tipos, materiasPrimas }) => {
                this.allTiposInsumo = tipos;
                this.allMateriasPrimas = materiasPrimas;

                this.setupAllAutocompletes();
                this.patchForm();
                this.isLoading = false;
            },
            error: (err) => {
                this.notificationService.showError('Error al cargar datos iniciales.');
                this.isLoading = false;
                this.dialogRef.close();
            }
        });
        this.subscriptions.add(sub);
    }
    
    private patchForm(): void {
        if (this.mode === 'edit' && this.data.insumo) {
            this.form.patchValue({
                nombre: this.data.insumo.nombre,
                cantidadMateriaPrima: this.data.insumo.cantidadMateriaPrima
            });

            if (this.data.insumo.idTipo) {
                const tipo = this.allTiposInsumo.find(t => t.codigo === this.data.insumo.idTipo);
                if (tipo) this.form.get('tipoInsumo').setValue(tipo);
            }

            if (this.data.insumo.idMateriaPrima) {
                const materia = this.allMateriasPrimas.find(m => m.id === this.data.insumo.idMateriaPrima);
                if (materia) this.form.get('materiaPrima').setValue(materia);
            }
        }
    }

    private setupDynamicValidators(): void {
        const sub = this.form.get('materiaPrima').valueChanges.subscribe((value: IMateriaPrima | null) => {
            const cantidadControl = this.form.get('cantidadMateriaPrima');
            this.selectedMateriaPrima = value;

            if (value) {
                cantidadControl.setValidators([Validators.required, Validators.min(0.0001)]);
            } else {
                cantidadControl.clearValidators();
                cantidadControl.setValue(null);
            }
            cantidadControl.updateValueAndValidity();
        });
        this.subscriptions.add(sub);
    }

    private setupAllAutocompletes(): void {
        this.filteredTiposInsumo$ = this.form.get('tipoInsumo').valueChanges.pipe(
            startWith(''),
            map(value => (typeof value === 'string' ? value : value?.nombre) || ''),
            map(name => (name ? this._filterTipos(name) : this.allTiposInsumo.slice()))
        );

        this.filteredMateriasPrimas$ = this.form.get('materiaPrima').valueChanges.pipe(
            startWith(''),
            map(value => (typeof value === 'string' ? value : value?.nombre) || ''),
            map(name => (name ? this._filterMaterias(name) : this.allMateriasPrimas.slice()))
        );
    }

    private _filterTipos(name: string): ITipoInsumo[] {
        const filterValue = name.toLowerCase();
        return this.allTiposInsumo.filter(tipo => tipo.nombre.toLowerCase().includes(filterValue));
    }

    private _filterMaterias(name: string): IMateriaPrima[] {
        const filterValue = name.toLowerCase();
        return this.allMateriasPrimas.filter(m => m.nombre.toLowerCase().includes(filterValue));
    }

    displayTipoInsumoFn(tipo: ITipoInsumo): string {
        return tipo && tipo.nombre ? tipo.nombre : '';
    }

    displayMateriaPrimaFn(materia: IMateriaPrima): string {
        return materia && materia.nombre ? materia.nombre : '';
    }

    clearTipoInsumoSelection(): void {
        this.form.get('tipoInsumo').setValue(null);
    }
    
    clearMateriaPrimaSelection(): void {
        this.form.get('materiaPrima').setValue(null);
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const tipoSeleccionado: ITipoInsumo = formValue.tipoInsumo;
        const materiaSeleccionada: IMateriaPrima = formValue.materiaPrima;

        let dto: Partial<IInsumo> = {
            nombre: formValue.nombre,
            idTipo: tipoSeleccionado?.codigo,
            tipoNombre: tipoSeleccionado?.nombre,
            idMateriaPrima: materiaSeleccionada?.id || null,
            materiaPrimaNombre: materiaSeleccionada?.nombre || null,
            cantidadMateriaPrima: formValue.cantidadMateriaPrima || null,
        };

        const request$ = this.mode === 'create'
            ? this.abmInsumosService.createInsumo(dto)
            : this.abmInsumosService.updateInsumo(this.data.insumo.id, dto);

        request$.subscribe({
            next: () => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Insumo ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`);
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.isLoading = false;
                console.error(err);
                this.notificationService.showError('Ocurrió un error al guardar los cambios.');
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}