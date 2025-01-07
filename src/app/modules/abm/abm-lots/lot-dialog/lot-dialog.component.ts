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
  templateUrl: './lot-dialog.component.html',
})
export class LotDialogComponent {
  public form: FormGroup;
  public submitted = false;

  constructor(
    private _formBuilder: FormBuilder,
    public _dialogRef: MatDialogRef<LotDialogComponent>,
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
