import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmInsumosService } from '../../abm-insumos.service';
import { ICreateInsumoStock } from '../../models/insumo.interface';

interface DialogData {
    idInsumo: number;
    unidadMedida: string;
    isGridEmpty: boolean;
}

interface TipoMovimiento {
    value: string;
    viewValue: string;
}

@Component({
    selector: 'app-insumo-stock-modal',
    templateUrl: './insumo-stock-modal.component.html',
    providers: [DatePipe]
})
export class InsumoStockModalComponent implements OnInit {
    form: FormGroup;
    isLoading = false;
    tiposDeMovimiento: TipoMovimiento[] = [];

    constructor(
        public dialogRef: MatDialogRef<InsumoStockModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private fb: FormBuilder,
        private abmInsumosService: AbmInsumosService,
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
            tipo: [this.data.isGridEmpty ? 'STOCK_INICIAL' : null, [Validators.required]],
            observaciones: [null, [Validators.maxLength(255)]]
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const dto: ICreateInsumoStock = {
            idInsumo: this.data.idInsumo,
            cantidad: formValue.cantidad,
            tipo: formValue.tipo,
            fecha: this.datePipe.transform(formValue.fecha, 'dd/MM/yyyy'),
            observaciones: formValue.observaciones
        };

        this.abmInsumosService.createInsumoStock(dto).subscribe({
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