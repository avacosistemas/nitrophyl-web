import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'check-param-dialog',
  templateUrl: './check-param-dialog.component.html',
  styleUrls: ['./check-param-dialog.component.scss'],
})
export class CheckParamDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CheckParamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { params: { nombre: string }[] }
  ) {}

  continue(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
