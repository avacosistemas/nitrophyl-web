import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './assay-dialog-confirm.component.html',
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    sinResultados(): void {
        this.dialogRef.close('sinResultados');
    }

    conResultados(): void {
        this.dialogRef.close('conResultados');
    }
}
