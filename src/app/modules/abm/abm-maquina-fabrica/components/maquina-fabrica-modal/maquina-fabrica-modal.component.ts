import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmMaquinaFabricaService } from '../../abm-maquina-fabrica.service';
import { AbmSectorFabricaService } from '../../../abm-sector-fabrica/abm-sector-fabrica.service';
import { ISectorFabrica } from '../../../abm-sector-fabrica/models/sector-fabrica.interface';
import { IMaquinaFabrica, IMaquinaFabricaDto } from '../../models/maquina-fabrica.interface';

interface DialogData {
    mode: 'create' | 'edit';
    maquina?: IMaquinaFabrica;
}

@Component({
    selector: 'app-maquina-fabrica-modal',
    templateUrl: './maquina-fabrica-modal.component.html'
})
export class MaquinaFabricaModalComponent implements OnInit {
    form!: FormGroup;
    mode: 'create' | 'edit';
    title: string;
    isLoading = false;
    sectores: ISectorFabrica[] = [];
    tiposMaquina = [
        { value: 'PRENSA', label: 'Prensa' },
        { value: 'EXTRUSORA_AUTOCLAVE', label: 'Extrusora Autoclave' },
        { value: 'INYECTOR', label: 'Inyector' }
    ];

    constructor(
        public dialogRef: MatDialogRef<MaquinaFabricaModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmMaquinaService: AbmMaquinaFabricaService,
        private abmSectorService: AbmSectorFabricaService,
        private notificationService: NotificationService,
    ) {
        this.mode = this.data.mode;
        this.title = this.mode === 'create' ? 'Crear Máquina' : 'Editar Máquina';
    }

    ngOnInit(): void {
        this.loadSectores();
        this.initForm();
    }

    private initForm(): void {
        this.form = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            idSector: [null, [Validators.required]],
            tipo: ['PRENSA', [Validators.required]]
        });

        if (this.mode === 'edit' && this.data.maquina) {
            this.form.patchValue({
                nombre: this.data.maquina.nombre,
                idSector: this.data.maquina.idSector,
                tipo: this.data.maquina.tipo
            });
        }
    }

    loadSectores(): void {
        this.abmSectorService.getSectoresCombo().subscribe({
            next: (response) => {
                this.sectores = response.data || [];
            },
            error: (err) => {
                console.error('Error al cargar sectores para el combo:', err);
                this.notificationService.showError('No se pudieron cargar los sectores.');
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const selectedSectorId = this.form.value.idSector;
        const selectedSector = this.sectores.find(s => s.id === selectedSectorId);
        const sectorNombre = selectedSector ? selectedSector.nombre : '';

        this.isLoading = true;
        const dto: IMaquinaFabricaDto = {
            idSector: selectedSectorId,
            nombre: this.form.value.nombre,
            sector: sectorNombre,
            tipo: this.form.value.tipo
        };

        if (this.mode === 'edit' && this.data.maquina) {
            dto.id = this.data.maquina.id;
        }

        const request$ = this.mode === 'create'
            ? this.abmMaquinaService.createMaquina(dto)
            : this.abmMaquinaService.updateMaquina(this.data.maquina!.id, dto);

        request$.subscribe({
            next: (response) => {
                this.isLoading = false;
                this.notificationService.showSuccess(`Máquina ${this.mode === 'create' ? 'creada' : 'actualizada'} correctamente.`);
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
