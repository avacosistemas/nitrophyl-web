import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmMateriaPrimaService } from '../../abm-materiaprima.service';
import { IMateriaPrima } from '../../models/materia-prima.interface';

interface DialogData {
    mode: 'create' | 'edit';
    materiaPrima?: IMateriaPrima;
}

@Component({
    selector: 'app-materia-prima-modal',
    templateUrl: './materia-prima-modal.component.html'
})
export class MateriaPrimaModalComponent implements OnInit {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;
    unidadesDeMedida = [{ value: 'G', viewValue: 'Gramos (G)' }, { value: 'KG', viewValue: 'Kilogramos (KG)' }];

    constructor(
        public dialogRef: MatDialogRef<MateriaPrimaModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmMateriaPrimaService: AbmMateriaPrimaService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Materia Prima' : 'Editar Materia Prima';
    }

    ngOnInit(): void {
        this.initForm();
        if (this.mode === 'edit' && this.data.materiaPrima) {
            this.form.patchValue({
                nombre: this.data.materiaPrima.nombre,
                unidadMedida: this.data.materiaPrima.unidadMedidaStock
            });
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            unidadMedida: [null, [Validators.required]]
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const dto: Partial<IMateriaPrima> = {
            nombre: formValue.nombre,
            unidadMedidaStock: formValue.unidadMedida 
        };

        const request$ = this.mode === 'create'
            ? this.abmMateriaPrimaService.createMateriaPrima(dto)
            : this.abmMateriaPrimaService.updateMateriaPrima(this.data.materiaPrima.id, dto);

        request$.subscribe({
            next: () => {
                this.isLoading = false;
                const action = this.mode === 'create' ? 'creada' : 'actualizada';
                this.notificationService.showSuccess(`Materia prima ${action} correctamente.`);
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