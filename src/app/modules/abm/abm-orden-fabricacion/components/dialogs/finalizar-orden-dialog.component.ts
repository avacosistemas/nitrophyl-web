import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-finalizar-orden-dialog',
    template: `
        <h2 mat-dialog-title class="font-bold text-gray-800">Confirmar Producción</h2>
        <mat-dialog-content [formGroup]="form" class="flex flex-col gap-4">
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-gray-500 uppercase">Saldo Pendiente</span>
                <span class="text-xl font-bold text-primary">{{ data.saldoPendiente }}</span>
            </div>

            <p class="text-sm text-gray-600">Registre la cantidad producida y entregada en esta etapa.</p>

            <div class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Cantidad</mat-label>
                    <input type="number" matInput formControlName="cantidad" min="1" [max]="data.saldoPendiente">
                    <mat-error *ngIf="form.get('cantidad').hasError('max')">Máx: {{data.saldoPendiente}}</mat-error>
                    <mat-error *ngIf="form.get('cantidad').hasError('required')">Requerido</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Fecha</mat-label>
                    <input matInput [matDatepicker]="picker" formControlName="fechaEntregada">
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="pb-6">
            <button mat-button mat-dialog-close class="mr-2">Cancelar</button>
            <button mat-flat-button color="accent" [disabled]="form.invalid" class="rounded-full px-6" (click)="save()">
                Confirmar Producción
            </button>
        </mat-dialog-actions>
    `
})
export class FinalizarOrdenDialogComponent {
    form: FormGroup;
    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<FinalizarOrdenDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { saldoPendiente: number }
    ) {
        this.form = this.fb.group({
            fechaEntregada: [new Date(), Validators.required],
            cantidad: [data.saldoPendiente || 0, [Validators.required, Validators.min(1), Validators.max(data.saldoPendiente || 99999)]]
        });
    }
    save() {
        if (this.form.valid) this.dialogRef.close(this.form.value);
    }
}