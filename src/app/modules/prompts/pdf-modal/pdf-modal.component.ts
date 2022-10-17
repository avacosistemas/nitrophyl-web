import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: 'pdf-modal-dialog',
    templateUrl: 'pdf-modal.component.html',
    styleUrls: ['./pdf-modal.component.scss']
})

export class PDFModalDialogComponent implements OnInit{
    comments: string;
    pdfSrc;

    constructor(
        public dialogRef: MatDialogRef<PDFModalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
    ){}

    ngOnInit(): void {
        this.pdfSrc = 'data:application/pdf;base64,' + this.data.src;
    }

    save() {
        this.dialogRef.close(true)
    }

    close() {
        this.dialogRef.close(false)
    }
}