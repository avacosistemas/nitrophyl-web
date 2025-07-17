import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmPrensaService } from '../../abm-prensa.service';
import { IPrensa, IPrensaDto } from '../../models/prensa.interface';

interface DialogData {
    mode: 'create' | 'edit';
    prensa?: IPrensa;
}

@Component({
    selector: 'app-prensa-modal',
    templateUrl: './prensa-modal.component.html'
})
export class PrensaModalComponent implements OnInit {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;

    constructor(
        public dialogRef: MatDialogRef<PrensaModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmPrensaService: AbmPrensaService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Prensa' : 'Editar Prensa';
    }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
        });

        if (this.mode === 'edit' && this.data.prensa) {
            this.form.patchValue({ nombre: this.data.prensa.nombre });
        }
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const dto: IPrensaDto = {
            nombre: this.form.value.nombre
        };

        const request$ = this.mode === 'create'
            ? this.abmPrensaService.createPrensa(dto)
            : this.abmPrensaService.updatePrensa(this.data.prensa.id, dto);

        request$.subscribe({
            next: () => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Prensa ${this.mode === 'create' ? 'creada' : 'actualizada'} correctamente.`);
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