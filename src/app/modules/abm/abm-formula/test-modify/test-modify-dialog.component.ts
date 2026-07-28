import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'test-modify-dialog',
    templateUrl: './test-modify-dialog.component.html',
    styleUrls: ['./test-modify-dialog.component.scss']
})
export class TestModifyDialogComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<TestModifyDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            type: 'edit' | 'save';
            machine?: string;
        }
    ) {}

    ngOnInit(): void {}

    save(): void {
        this.dialogRef.close(true);
    }

    close(): void {
        this.dialogRef.close(false);
    }
}
