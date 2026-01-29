import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-asignar-prensa-dialog',
    templateUrl: './asignar-prensa-dialog.component.html',
})
export class AsignarPrensaDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    currentTotal: number = 0;

    totalColorClass: string = 'bg-gray-100 border-gray-200';
    totalTextClass: string = 'text-gray-800';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AsignarPrensaDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            cantidadSolicitada: number,
            stockDisponible: number,
            sugeridoFabrica: number,
            sugeridoStock: number
        }
    ) {
        this.form = this.fb.group({
            cantFabrica: [data.sugeridoFabrica || 0, [Validators.required, Validators.min(0)]],
            cantStock: [data.sugeridoStock || 0, [Validators.required, Validators.min(0)]],
            prensa: ['', Validators.required],
            operario: ['', Validators.required],
            fechaEstimada: [null, Validators.required]
        });
    }

    ngOnInit(): void {
        this.calculateTotal();

        this.form.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.calculateTotal();
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    calculateTotal(): void {
        const fabrica = this.form.get('cantFabrica').value || 0;
        const stock = this.form.get('cantStock').value || 0;

        this.currentTotal = fabrica + stock;
        const solicitada = this.data.cantidadSolicitada || 0;

        if (this.currentTotal === solicitada) {
            this.totalColorClass = 'bg-green-100 border-green-200';
            this.totalTextClass = 'text-green-800';
        } else if (this.currentTotal < solicitada) {
            this.totalColorClass = 'bg-red-100 border-red-200';
            this.totalTextClass = 'text-red-800';
        } else {
            this.totalColorClass = 'bg-yellow-100 border-yellow-200';
            this.totalTextClass = 'text-yellow-800';
        }
    }

    save() {
        if (this.form.valid) this.dialogRef.close(this.form.value);
    }
}