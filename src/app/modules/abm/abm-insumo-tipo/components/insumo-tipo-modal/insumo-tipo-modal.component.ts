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

    allPadresPosibles: IInsumoTipo[] = [];
    filteredPadres$: Observable<IInsumoTipo[]>;
    private subscriptions = new Subscription();

    constructor(
        public dialogRef: MatDialogRef<InsumoTipoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmInsumoTipoService: AbmInsumoTipoService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Tipo de Insumo' : 'Editar Tipo de Insumo';
    }

    ngOnInit(): void {
        this.initForm();
        this.loadPadresPosibles();

        const sub = this.form.get('tienePadre').valueChanges.subscribe(hasParent => {
            if (!hasParent) {
                this.form.get('padre').setValue(null);
            }
        });
        this.subscriptions.add(sub);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            tienePadre: [false],
            padre: [null]
        });
    }

    private loadPadresPosibles(): void {
        const sub = this.abmInsumoTipoService.getInsumoTipos().subscribe(tipos => {
            if (this.mode === 'edit') {
                this.allPadresPosibles = tipos.filter(t => t.id !== this.data.insumoTipo.id);
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
            this.form.patchValue({ nombre: this.data.insumoTipo.nombre });
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

        const padreSeleccionado: IInsumoTipo = formValue.padre;
        if (formValue.tienePadre && padreSeleccionado && padreSeleccionado.id) {
            dto.padre = { id: padreSeleccionado.id };
        }

        const request$ = this.mode === 'create'
            ? this.abmInsumoTipoService.createInsumoTipo(dto)
            : this.abmInsumoTipoService.updateInsumoTipo(this.data.insumoTipo.id, dto);

        request$.subscribe({
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
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}