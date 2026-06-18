import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmSectorFabricaService } from '../../abm-sector-fabrica.service';
import { ISectorFabrica, ISectorFabricaDto } from '../../models/sector-fabrica.interface';

interface DialogData {
    mode: 'create' | 'edit';
    sector?: ISectorFabrica;
    nombre?: string;
}

@Component({
    selector: 'app-sector-fabrica-modal',
    templateUrl: './sector-fabrica-modal.component.html'
})
export class SectorFabricaModalComponent implements OnInit {
    form!: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;

    constructor(
        public dialogRef: MatDialogRef<SectorFabricaModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmSectorService: AbmSectorFabricaService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Sector' : 'Editar Sector';
    }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
        });

        if (this.mode === 'edit' && this.data.sector) {
            this.form.patchValue({ nombre: this.data.sector.nombre });
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
        const dto: ISectorFabricaDto = {
            nombre: this.form.value.nombre
        };

        if (this.mode === 'edit' && this.data.sector) {
            dto.id = this.data.sector.id;
        }

        const request$ = this.mode === 'create'
            ? this.abmSectorService.createSector(dto)
            : this.abmSectorService.updateSector(this.data.sector!.id, dto);

        request$.subscribe({
            next: (response) => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Sector ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`);
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
