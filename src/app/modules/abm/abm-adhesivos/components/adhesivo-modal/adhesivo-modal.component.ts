import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmAdhesivosService } from '../../abm-adhesivos.service';
import { IAdhesivo, IAdhesivoDto } from '../../models/adhesivo.interface';

interface DialogData {
    mode: 'create' | 'edit';
    adhesivo?: IAdhesivo;
}

@Component({
    selector: 'app-adhesivo-modal',
    templateUrl: './adhesivo-modal.component.html'
})
export class AdhesivoModalComponent implements OnInit {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;

    constructor(
        public dialogRef: MatDialogRef<AdhesivoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmAdhesivosService: AbmAdhesivosService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Adhesivo' : 'Editar Adhesivo';
    }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
        });

        if (this.mode === 'edit' && this.data.adhesivo) {
            this.form.patchValue({ nombre: this.data.adhesivo.nombre });
        }
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const dto: IAdhesivoDto = {
            nombre: this.form.value.nombre
        };

        const request$ = this.mode === 'create'
            ? this.abmAdhesivosService.createAdhesivo(dto)
            : this.abmAdhesivosService.updateAdhesivo(this.data.adhesivo.id, dto);

        request$.subscribe({
            next: () => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Adhesivo ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`);
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