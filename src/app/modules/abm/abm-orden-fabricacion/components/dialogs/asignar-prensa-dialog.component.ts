import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-asignar-prensa-dialog',
    template: `
        <h2 mat-dialog-title>Asignar Prensa y Tarea</h2>
        <mat-dialog-content [formGroup]="form" class="flex flex-col gap-4 pt-4">
            <div class="flex gap-4">
                <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Cant. a Fabricar</mat-label>
                    <input matInput type="number" formControlName="cantFabrica">
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Tomar de Stock</mat-label>
                    <input matInput type="number" formControlName="cantStock">
                </mat-form-field>
            </div>
            <div class="flex gap-4">
                <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Nro. Prensa</mat-label>
                    <input matInput formControlName="prensa">
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Operario</mat-label>
                    <input matInput formControlName="operario">
                </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-full">
                <mat-label>Fecha Estimada Entrega</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="fechaEstimada">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancelar</button>
            <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Asignar</button>
        </mat-dialog-actions>
    `
})
export class AsignarPrensaDialogComponent {
    form: FormGroup;
    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AsignarPrensaDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.form = this.fb.group({
            cantFabrica: [data.sugeridoFabrica || 0, [Validators.required, Validators.min(0)]],
            cantStock: [data.sugeridoStock || 0, [Validators.required, Validators.min(0)]],
            prensa: ['', Validators.required],
            operario: ['', Validators.required],
            fechaEstimada: [null, Validators.required]
        });
    }
    save() {
        if (this.form.valid) this.dialogRef.close(this.form.value);
    }
}