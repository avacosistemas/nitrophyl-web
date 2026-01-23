import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-lot-status-change',
  template: `
    <form [formGroup]="form" class="flex flex-col gap-3 mt-2">
      <!-- Selector de Estado -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Nuevo Estado</mat-label>
        <mat-select formControlName="estado">
          <mat-option value="APROBADO">Aprobado</mat-option>
          <mat-option value="APROBADO_OBSERVADO">Aprobado con observaciones</mat-option>
          <mat-option value="RECHAZADO">Rechazado</mat-option>
        </mat-select>
        <mat-error *ngIf="form.get('estado').hasError('required')">Requerido</mat-error>
      </mat-form-field>

      <!-- Selector de Fecha -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Fecha de Cambio de Estado</mat-label>
        <input matInput [matDatepicker]="picker" formControlName="fecha" [min]="minDate">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
        <mat-error *ngIf="form.get('fecha').hasError('required')">Requerido</mat-error>
        <mat-error *ngIf="form.get('fecha').hasError('matDatepickerMin')">
          La fecha no puede ser anterior a la creación del lote
        </mat-error>
      </mat-form-field>

      <!-- Observaciones -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Comentarios / Observaciones</mat-label>
        <textarea matInput formControlName="observaciones" rows="3"></textarea>
        <mat-error *ngIf="form.get('observaciones').hasError('required')">Requerido</mat-error>
      </mat-form-field>
    </form>
  `
})
export class LotStatusChangeComponent implements OnInit {
  form: FormGroup;
  @Input() minDate: Date;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      estado: ['', Validators.required],
      fecha: [new Date(), Validators.required],
      observaciones: ['', Validators.required] 
    });
  }

  getValue(): any {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return null;
    }
    
    return this.form.value;
  }
}