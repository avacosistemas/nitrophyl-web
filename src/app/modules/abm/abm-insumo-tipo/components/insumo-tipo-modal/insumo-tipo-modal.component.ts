import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { AbmInsumoTipoService } from '../../abm-insumo-tipo.service';
import { IInsumoTipo, IInsumoTipoDto } from '../../models/insumo-tipo.interface';

interface DialogData {
    mode: 'create' | 'edit';
    insumoTipo?: IInsumoTipo;
}

@Component({
    selector: 'app-insumo-tipo-modal',
    templateUrl: './insumo-tipo-modal.component.html'
})
export class InsumoTipoModalComponent implements OnInit, OnDestroy {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;
    private currentId: number;

    allPadresPosibles: IInsumoTipo[] = [];
    filteredPadres$: Observable<IInsumoTipo[]>;
    private subscriptions = new Subscription();

    public tiposStock = [
        { label: 'M²', value: 'ROLLOM2DIAM' },
        { label: 'Unidades', value: 'UNIDAD' },
        { label: 'Unidades Por peso', value: 'GRAMOSUNIDAD' },
        { label: 'Unidades Por Metro', value: 'UNIDADXMETRO' }
    ];

    constructor(
        public dialogRef: MatDialogRef<InsumoTipoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmInsumoTipoService: AbmInsumoTipoService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Tipo de Insumo' : 'Editar Tipo de Insumo';

        if (this.mode === 'edit' && this.data.insumoTipo) {
            this.currentId = this.data.insumoTipo.id;
        }
    }

    ngOnInit(): void {
        this.initForm();
        this.loadPadresPosibles();
        this.setupDynamicValidators();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            tienePadre: [false],
            padre: [null],
            tipoStock: [null, [Validators.required]]
        });
    }

    private setupDynamicValidators(): void {
        const tienePadreControl = this.form.get('tienePadre');
        const tipoStockControl = this.form.get('tipoStock');
        const padreControl = this.form.get('padre');

        const sub = tienePadreControl.valueChanges.subscribe(hasParent => {
            if (hasParent) {
                tipoStockControl.setValue(null);
                tipoStockControl.clearValidators();
            } else {
                padreControl.setValue(null);
                tipoStockControl.setValidators([Validators.required]);
            }
            tipoStockControl.updateValueAndValidity();
        });
        this.subscriptions.add(sub);
    }

     private loadPadresPosibles(): void {
        const sub = this.abmInsumoTipoService.getInsumoTipos().subscribe(tipos => {
            if (this.mode === 'edit') {
                this.allPadresPosibles = tipos.filter(t => t.id !== this.currentId);
            } else {
                this.allPadresPosibles = tipos;
            }
            this.setupAutocomplete();
            this.patchForm();
        });
        this.subscriptions.add(sub);
    }

    private patchForm(): void {
        if (this.mode === 'edit' && this.data.insumoTipo) {
            this.form.patchValue({
                nombre: this.data.insumoTipo.nombre,
                tipoStock: this.data.insumoTipo.tipoStock
            });
            if (this.data.insumoTipo.padre) {
                const padreSeleccionado = this.allPadresPosibles.find(p => p.id === this.data.insumoTipo.padre.id);
                if (padreSeleccionado) {
                    this.form.get('tienePadre').setValue(true);
                    this.form.get('padre').setValue(padreSeleccionado);
                }
            }
        }
    }

    private setupAutocomplete(): void {
        this.filteredPadres$ = this.form.get('padre').valueChanges.pipe(
            startWith(''),
            map(value => (typeof value === 'string' ? value : value?.nombre) || ''),
            map(name => (name ? this._filter(name) : this.allPadresPosibles.slice()))
        );
    }

    private _filter(name: string): IInsumoTipo[] {
        const filterValue = name.toLowerCase();
        return this.allPadresPosibles.filter(tipo => tipo.nombre.toLowerCase().includes(filterValue));
    }

    public clearPadreSelection(): void {
        this.form.get('padre').setValue(null);
    }

    displayFn(tipo: IInsumoTipo): string {
        return tipo && tipo.nombre ? tipo.nombre : '';
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const dto: IInsumoTipoDto = {
            nombre: formValue.nombre,
        };

        if (formValue.tienePadre) {
            const padreSeleccionado: IInsumoTipo = formValue.padre;
            if (padreSeleccionado && padreSeleccionado.id) {
                dto.padre = { id: padreSeleccionado.id };
            }
        } else {
            dto.tipoStock = formValue.tipoStock;
        }

        const request$ = this.mode === 'create'
            ? this.abmInsumoTipoService.createInsumoTipo(dto)
            : this.abmInsumoTipoService.updateInsumoTipo(this.currentId, dto);

        const sub = request$.subscribe({
            next: () => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Tipo de insumo ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`);
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.isLoading = false;
                console.error(err);
                this.notificationService.showError('Ocurrió un error al guardar los cambios.');
            }
        });
        this.subscriptions.add(sub);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}