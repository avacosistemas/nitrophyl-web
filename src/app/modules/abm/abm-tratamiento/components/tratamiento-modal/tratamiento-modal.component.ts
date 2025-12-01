import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmTratamientoService } from '../../abm-tratamiento.service';
import { ITratamiento, ITratamientoDto } from '../../models/tratamiento.interface';

interface DialogData {
    mode: 'create' | 'edit';
    tratamiento?: ITratamiento;
    nombre?: string;
}

@Component({
    selector: 'app-tratamiento-modal',
    templateUrl: './tratamiento-modal.component.html'
})
export class TratamientoModalComponent implements OnInit {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;

    constructor(
        public dialogRef: MatDialogRef<TratamientoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmTratamientoService: AbmTratamientoService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Tratamiento' : 'Editar Tratamiento';
    }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
        });

        if (this.mode === 'edit' && this.data.tratamiento) {
            this.form.patchValue({ nombre: this.data.tratamiento.nombre });
        } else if (this.mode === 'create' && this.data.nombre) {
            this.form.patchValue({ nombre: this.data.nombre });
        }
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const dto: ITratamientoDto = {
            nombre: this.form.value.nombre
        };

        const request$ = this.mode === 'create'
            ? this.abmTratamientoService.createTratamiento(dto)
            : this.abmTratamientoService.updateTratamiento(this.data.tratamiento.id, dto);

        request$.subscribe({
            next: (response) => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Tratamiento ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`);
                this.dialogRef.close(response.data);
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