import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';

@Component({
    selector: 'app-orden-compra-pieza-edit-modal',
    templateUrl: './orden-compra-pieza-edit-modal.component.html',
    styleUrls: ['./orden-compra-pieza-edit-modal.component.scss']
})
export class OrdenCompraPiezaEditModalComponent implements OnInit {
    form: FormGroup;
    denominacion: string = '';

    constructor(
        private _fb: FormBuilder,
        private _dialogRef: MatDialogRef<OrdenCompraPiezaEditModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.denominacion = data.denominacion || '';
        
        const initialDate = data.fechaCotizacion ? moment(data.fechaCotizacion, 'DD/MM/YYYY').toDate() : null;

        this.form = this._fb.group({
            precio: [data.precio || 0, [Validators.required, Validators.min(0)]],
            fechaCotizacion: [initialDate, Validators.required],
            aplicarDescuento: [data.descuento !== null && data.descuento !== undefined],
            descuento: [data.descuento, [Validators.min(0), Validators.max(100)]],
            observacion: [data.observacion || '']
        });
    }

    ngOnInit(): void {
        this.form.get('aplicarDescuento')!.valueChanges.subscribe((apply) => {
            const descCtrl = this.form.get('descuento')!;
            if (apply) {
                descCtrl.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
            } else {
                descCtrl.clearValidators();
                descCtrl.setValue(null);
            }
            descCtrl.updateValueAndValidity();
        });

        if (this.form.get('aplicarDescuento')!.value) {
            this.form.get('descuento')!.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
            this.form.get('descuento')!.updateValueAndValidity();
        }
    }

    onPriceInput(event: any): void {
        let val = event.target.value;
        if (val.includes(',')) {
            val = val.replace(',', '.');
            this.form.get('precio')!.setValue(val, { emitEvent: false });
        }
    }

    cancel(): void {
        this._dialogRef.close();
    }

    confirm(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        this._dialogRef.close({
            precio: parseFloat(raw.precio || 0),
            fechaCotizacion: raw.fechaCotizacion ? moment(raw.fechaCotizacion) : null,
            descuento: raw.aplicarDescuento && raw.descuento !== null && raw.descuento !== undefined && raw.descuento !== '' ? parseFloat(raw.descuento) : null,
            observacion: raw.observacion || ''
        });
    }

    get precioUnitarioActual(): number {
        const val = this.form.get('precio')!.value;
        return parseFloat(val || 0);
    }

    get precioDescuentoCalculado(): number {
        const aplicar = this.form.get('aplicarDescuento')!.value;
        const desc = parseFloat(this.form.get('descuento')!.value || 0);
        if (aplicar && desc > 0) {
            return this.precioUnitarioActual * (desc / 100);
        }
        return 0;
    }

    formatCurrency(value: number): string {
        if (value === null || value === undefined) return 'U$D 0.000';
        return 'U$D ' + value.toFixed(3);
    }
}
