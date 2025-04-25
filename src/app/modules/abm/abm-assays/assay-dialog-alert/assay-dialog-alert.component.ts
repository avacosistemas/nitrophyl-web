import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'assay-dialog-alert',
    templateUrl: './assay-dialog-alert.component.html',
    styleUrls: ['./assay-dialog-alert.component.scss']
})
export class AssayDialogAlertComponent implements OnInit, AfterViewInit {
  @ViewChild('closeButton') closeButton: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<AssayDialogAlertComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            type: 'edit' | 'save';
            machine?: string;
        }
    ) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
      setTimeout(() => this.closeButton.nativeElement.blur(), 0);
    }

    confirm(): void {
        this.dialogRef.close(true);
    }

    close(): void {
        this.dialogRef.close(false);
    }
}
