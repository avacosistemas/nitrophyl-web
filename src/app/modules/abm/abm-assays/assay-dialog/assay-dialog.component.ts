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
import { AssaysComponent } from '../assays/assays.component';

@Component({
  selector: 'app-assay-dialog',
  template: `
    <form [formGroup]="form">
      <h1 class="text-2xl font-semibold py-4">
        ¿Cuál es el resultado general del ensayo?
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
          <mat-radio-button value="RECHAZADO">
            <mat-icon [style.color]="'red'">warning</mat-icon>
          </mat-radio-button>
        </mat-radio-group>
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
  `,
})
export class AssayDialogComponent {
  public form: FormGroup = this._formBuilder.group({
    status: new FormControl({ value: null, disabled: false }, [
      Validators.required,
    ]),
    observation: new FormControl({ value: null, disabled: false }, [
      Validators.maxLength(255),
    ]),
  });
  public submitted = false;

  constructor(
    private _formBuilder: FormBuilder,
    public _dialogRef: MatDialogRef<AssaysComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  public confirm(): void {
    this.submitted = true;
    if (this.form.valid) {
      this._dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
