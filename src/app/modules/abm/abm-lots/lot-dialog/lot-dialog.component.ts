import { Component, Inject } from '@angular/core';

// * Forms.
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

// * Material.
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// * Components.
import { LotsComponent } from '../lots/lots.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';

@Component({
  selector: 'app-lot-dialog',
  providers: [// The locale would typically be provided on the root module of your application. We do it at
    // the component level here, due to limitations of our example generation script.
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },

    // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
    // `MatMomentDateModule` in your applications root module. We provide it at the component level
    // here, due to limitations of our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },],
  template: `
    <ng-container *ngIf="data.set === 'APPROVE'; else reject">
      <form [formGroup]="form">
        <h1 class="text-2xl font-semibold py-4">
          ¿Cuál es el estado del lote?
        </h1>

        <div class="py-4">
          <mat-radio-group
            formControlName="status"
            class="w-full flex justify-evenly items-center"
          >
            <mat-radio-button value="APROBADO">
              <mat-icon [style.color]="'green'">check_circle</mat-icon>
            </mat-radio-button>
            <mat-radio-button value="APROBADO_OBSERVADO">
              <mat-icon [style.color]="'yellow'">error</mat-icon>
            </mat-radio-button>
          </mat-radio-group>
        </div>

        <div class="py-4">
          <mat-form-field class="w-full">
            <input matInput [matDatepicker]="picker" formControlName="fecha" placeholder="Fecha Aprobacion" >
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error>Fecha Aprobacion requerida</mat-error>
          </mat-form-field>
        </div>

        <div class="py-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label> Observaciones </mat-label>
            <textarea
              matInput
              formControlName="observation"
              placeholder="Observaciones"
              maxlength="255"
            ></textarea>
          </mat-form-field>
        </div>

        <div class="flex justify-center items-center">
          <mat-error *ngIf="submitted && form.controls.status.invalid"
            >Resultado requerido</mat-error
          >
        </div>

        <div class="flex w-full py-4 row gap-3 justify-between items-center">
          <button
            mat-stroked-button
            mat-dialog-close
            class="mat-focus-indicator mat-stroked-button mat-button-base"
          >
            <span class="mat-button-wrapper"> Cerrar </span>
            <span matripple="" class="mat-ripple mat-button-ripple"></span>
            <span class="mat-button-focus-overlay"></span>
          </button>

          <button
            mat-flat-button
            class="mat-focus-indicator mat-flat-button mat-button-base mat-accent mr-4"
            (click)="confirm()"
          >
            <span class="mat-button-wrapper"> Guardar </span>
            <span matripple="" class="mat-ripple mat-button-ripple"></span>
            <span class="mat-button-focus-overlay"></span>
          </button>
        </div>
      </form>
    </ng-container>
    <ng-template #reject>
      <form [formGroup]="form">
        <h1 class="text-2xl font-semibold py-4">¿Rechazar?</h1>

        <div class="py-4">
          <mat-form-field class="w-full">
            <input matInput [matDatepicker]="picker" formControlName="fecha" placeholder="Fecha Rechazo" >
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error>Fecha Rechazo requerida</mat-error>
          </mat-form-field>
        </div>

        <div class="py-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label> Observaciones </mat-label>
            <textarea
              matInput
              formControlName="observation"
              placeholder="Observaciones"
              maxlength="255"
            ></textarea>
          </mat-form-field>
        </div>

        <div class="flex w-full py-4 row gap-3 justify-between items-center">
          <button
            mat-stroked-button
            mat-dialog-close
            class="mat-focus-indicator mat-stroked-button mat-button-base"
          >
            <span class="mat-button-wrapper"> Cerrar </span>
            <span matripple="" class="mat-ripple mat-button-ripple"></span>
            <span class="mat-button-focus-overlay"></span>
          </button>

          <button
            mat-flat-button
            class="mat-focus-indicator mat-flat-button mat-button-base mat-accent mr-4"
            (click)="confirm()"
          >
            <span class="mat-button-wrapper"> Guardar </span>
            <span matripple="" class="mat-ripple mat-button-ripple"></span>
            <span class="mat-button-focus-overlay"></span>
          </button>
        </div>
      </form>
    </ng-template>
  `,
})
export class LotDialogComponent {
  public form: FormGroup;
  public submitted = false;

  constructor(
    private _formBuilder: FormBuilder,
    public _dialogRef: MatDialogRef<LotsComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: any
  ) {
    this._form();
  }

  public confirm(): void {
    if (this.data.set === 'APPROVE') {
      this.submitted = true;
      if (this.form.valid) {
        this._dialogRef.close(this.form.value);
      } else {
        this.form.markAllAsTouched();
      }
    } else {
      if (this.form.valid) {
        this._dialogRef.close({
          status: 'RECHAZADO',
          observation: this.form.controls.observation.value,
          fecha: this.form.controls.fecha.value
        });
      } else {
        this.form.markAllAsTouched();
      }
    }
  }

  private _form(): void {
    if (this.data.set === 'APPROVE') {
      this.form = this._formBuilder.group({
        status: new FormControl({ value: null, disabled: false }, [
          Validators.required,
        ]),
        observation: new FormControl({ value: null, disabled: false }, [
          Validators.maxLength(255),
        ]),
        fecha: new FormControl({ value: new Date(), disabled: false }, [
          Validators.maxLength(10), Validators.required
        ])
      });
    } else {
      this.form = this._formBuilder.group({
        observation: new FormControl({ value: null, disabled: false }, [
          Validators.maxLength(255),
        ]),
        fecha: new FormControl({ value: new Date(), disabled: false }, [
          Validators.maxLength(10), Validators.required
        ])
      });
    }
  }
}
