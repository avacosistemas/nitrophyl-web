import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { AbmInsumosService } from '../../abm-insumos.service';
import { IInsumo } from '../../models/insumo.interface';
import { ITipoInsumo } from '../../models/tipo-insumo.interface';

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
        this.loadTiposInsumo();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            tipoInsumo: [null]
        });
    }

    private loadTiposInsumo(): void {
        const sub = this.abmInsumosService.getTiposInsumo().subscribe(tipos => {
            this.allTiposInsumo = tipos;
            this.setupAutocomplete();

            if (this.mode === 'edit' && this.data.insumo) {
                this.form.patchValue({ nombre: this.data.insumo.nombre });
                if (this.data.insumo.idTipo) {
                    const tipoSeleccionado = this.allTiposInsumo.find(t => t.id === this.data.insumo.idTipo);
                    if (tipoSeleccionado) {
                        this.form.get('tipoInsumo').setValue(tipoSeleccionado);
                    }
                }
            }
        });
        this.subscriptions.add(sub);
    }

    private setupAutocomplete(): void {
        this.filteredTiposInsumo$ = this.form.get('tipoInsumo').valueChanges.pipe(
            startWith(''),
            map(value => (typeof value === 'string' ? value : value?.nombre) || ''),
            map(name => (name ? this._filter(name) : this.allTiposInsumo.slice()))
        );
    }

    private _filter(name: string): ITipoInsumo[] {
        const filterValue = name.toLowerCase();
        return this.allTiposInsumo.filter(tipo => tipo.nombre.toLowerCase().includes(filterValue));
    }

    displayFn(tipo: ITipoInsumo): string {
        return tipo && tipo.nombre ? tipo.nombre : '';
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        let dto: Partial<IInsumo> = {
            nombre: formValue.nombre
        };

        const tipoSeleccionado: ITipoInsumo = formValue.tipoInsumo;
        if (tipoSeleccionado && tipoSeleccionado.id) {
            dto.idTipo = tipoSeleccionado.id;
            dto.tipoNombre = tipoSeleccionado.nombre;
        } else {
            dto.idTipo = null;
            dto.tipoNombre = null;
        }

        if (this.mode === 'edit') {
            dto.id = this.data.insumo.id;
        }

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