import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-finalizar-orden-dialog',
    template: `
        <h2 mat-dialog-title>Marcar como Entregada/Finalizada</h2>
        <mat-dialog-content [formGroup]="form">
            <p class="mb-4 text-gray-600">Confirme la fecha real de entrega para cerrar la orden.</p>
            <mat-form-field appearance="outline" class="w-full">
                <mat-label>Fecha de Entrega</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="fechaEntregada">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancelar</button>
            <button mat-flat-button color="accent" [disabled]="form.invalid" (click)="save()">Finalizar Orden</button>
        </mat-dialog-actions>
    `
})
export class FinalizarOrdenDialogComponent {
    form: FormGroup;
    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<FinalizarOrdenDialogComponent>
    ) {
        this.form = this.fb.group({
            fechaEntregada: [new Date(), Validators.required] 
        });
    }
    save() {
        if (this.form.valid) this.dialogRef.close(this.form.value);
    }
}