import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  title?: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  showBackButton?: boolean;
  seccion?: string;
}

@Component({
  selector: 'app-dialog-custom',
  templateUrl: './dialog-custom.component.html',
  styleUrls: ['./dialog-custom.component.css'],
})
export class DialogCustomComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogCustomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onBack(): void {
    this.dialogRef.close('back');
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}