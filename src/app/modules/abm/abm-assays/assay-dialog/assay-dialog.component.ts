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
  templateUrl: './assay-dialog.component.html',
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
