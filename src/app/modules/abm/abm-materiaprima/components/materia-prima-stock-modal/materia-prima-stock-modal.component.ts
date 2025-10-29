import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmMateriaPrimaService } from '../../abm-materiaprima.service';
import { ICreateMateriaPrimaStock } from '../../models/materia-prima.interface';

interface DialogData {
    idMateriaPrima: number;
    unidadMedida: 'G' | 'KG';
    isGridEmpty: boolean;
}

interface TipoMovimiento {
    value: string;
    viewValue: string;
}

@Component({
    selector: 'app-materia-prima-stock-modal',
    templateUrl: './materia-prima-stock-modal.component.html',
    providers: [DatePipe]
})
export class MateriaPrimaStockModalComponent implements OnInit {
    form: FormGroup;
    isLoading = false;
    tiposDeMovimiento: TipoMovimiento[] = [];

    constructor(
        public dialogRef: MatDialogRef<MateriaPrimaStockModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmMateriaPrimaService: AbmMateriaPrimaService,
        private notificationService: NotificationService,
        private datePipe: DatePipe,
    ) { }

    ngOnInit(): void {
        this.setupTiposMovimiento();
        this.initForm();
    }

    private setupTiposMovimiento(): void {
        if (this.data.isGridEmpty) {
            this.tiposDeMovimiento = [
                { value: 'STOCK_INICIAL', viewValue: 'Stock Inicial' }
            ];
        } else {
            this.tiposDeMovimiento = [
                { value: 'INGRESO', viewValue: 'Ingreso' },
                { value: 'DESPERDICIO', viewValue: 'Desperdicio' },
                { value: 'RECUENTO_ANUAL', viewValue: 'Recuento Anual' }
            ];
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            fecha: [new Date(), [Validators.required]],
            cantidad: [null, [Validators.required, Validators.min(0.001)]],
            tipo: [this.data.isGridEmpty ? 'STOCK_INICIAL' : null, [Validators.required]]
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const dto: ICreateMateriaPrimaStock = {
            idMateriaPrima: this.data.idMateriaPrima,
            cantidad: formValue.cantidad,
            tipo: formValue.tipo,
            fecha: this.datePipe.transform(formValue.fecha, 'dd/MM/yyyy')
        };

        this.abmMateriaPrimaService.createMateriaPrimaStock(dto).subscribe({
            next: () => {
                this.isLoading = false;
                this.notificationService.showSuccess('Stock actualizado correctamente.');
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.isLoading = false;
                console.error(err);
                this.notificationService.showError('Ocurrió un error al actualizar el stock.');
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}