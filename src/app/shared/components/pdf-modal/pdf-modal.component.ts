import { Component, Inject, OnInit, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as FileSaver from 'file-saver';

@Component({
    selector: 'pdf-modal-dialog',
    templateUrl: 'pdf-modal.component.html',
    styleUrls: ['./pdf-modal.component.scss']
})

export class PDFModalDialogComponent implements OnInit{
    comments: string;
    pdfSrc: string;

    constructor(
        public dialogRef: MatDialogRef<PDFModalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { src: string; title: string; showDownloadButton?: boolean },
    ){}

    ngOnInit(): void {
        this.pdfSrc = 'data:application/pdf;base64,' + this.data.src;
    }

    save(): void {
        this.dialogRef.close(true);
    }

    close(): void {
        this.dialogRef.close(false);
    }

    downloadPdf(): void {
        if (this.data.src && this.data.title) {
            const byteString = atob(this.data.src);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([ab], { type: 'application/pdf' });
            FileSaver.saveAs(blob, this.data.title);
        } else {
            console.error('No se pudo descargar el archivo PDF, ya que el título o la fuente son inválidos.');
        }
    }

    shouldShowDownloadButton(): boolean {
        return this.data.showDownloadButton === true;
    }
}
