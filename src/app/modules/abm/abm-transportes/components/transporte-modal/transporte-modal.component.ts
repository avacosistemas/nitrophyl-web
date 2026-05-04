import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmTransportesService } from '../../abm-transportes.service';
import { ITransporte, ITransporteDto } from '../../models/transporte.interface';

interface DialogData {
    mode: 'create' | 'edit';
    transporte?: ITransporte;
}

@Component({
    selector: 'app-transporte-modal',
    templateUrl: './transporte-modal.component.html'
})
export class TransporteModalComponent implements OnInit {
    form: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;

    mediosEnvioOptions = [
        { label: 'Avión', value: 'avion' },
        { label: 'Micro', value: 'micro' },
        { label: 'Barco', value: 'barco' },
        { label: 'Camión', value: 'camion' },
        { label: 'Tren', value: 'tren' }
    ];

    constructor(
        public dialogRef: MatDialogRef<TransporteModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmTransportesService: AbmTransportesService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Transporte' : 'Editar Transporte';
    }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            direccion: ['', [Validators.required, Validators.maxLength(200)]],
            telefono: ['', [Validators.required, Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
            horarioAtencion: ['', [Validators.required, Validators.maxLength(200)]],
            observaciones: ['', [Validators.maxLength(500)]],
            mediosEnvio: this.fb.array([])
        });

        this.addCheckboxes();

        if (this.mode === 'edit' && this.data.transporte) {
            const transporte = this.data.transporte;
            this.form.patchValue({
                nombre: transporte.nombre,
                direccion: transporte.direccion,
                telefono: transporte.telefono,
                email: transporte.email,
                horarioAtencion: transporte.horarioAtencion,
                observaciones: transporte.observaciones
            });

            const selectedMedios = transporte.mediosEnvio || [];
            const formArray = this.form.get('mediosEnvio') as FormArray;
            this.mediosEnvioOptions.forEach((option, index) => {
                if (selectedMedios.includes(option.value)) {
                    formArray.at(index).setValue(true);
                }
            });
        }
    }

    private addCheckboxes(): void {
        const formArray = this.form.get('mediosEnvio') as FormArray;
        this.mediosEnvioOptions.forEach(() => formArray.push(new FormControl(false)));
    }

    get mediosEnvioFormArray(): FormArray {
        return this.form.get('mediosEnvio') as FormArray;
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const selectedMediosValues = this.form.value.mediosEnvio
            .map((checked, i) => checked ? this.mediosEnvioOptions[i].value : null)
            .filter(value => value !== null);

        this.isLoading = true;
        const dto: ITransporteDto = {
            nombre: this.form.value.nombre,
            direccion: this.form.value.direccion,
            telefono: this.form.value.telefono,
            email: this.form.value.email,
            horarioAtencion: this.form.value.horarioAtencion,
            observaciones: this.form.value.observaciones,
            mediosEnvio: selectedMediosValues
        };

        const request$ = this.mode === 'create'
            ? this.abmTransportesService.createTransporte(dto)
            : this.abmTransportesService.updateTransporte(this.data.transporte.id, dto);

        request$.subscribe({
            next: (response) => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Transporte ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`);
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
