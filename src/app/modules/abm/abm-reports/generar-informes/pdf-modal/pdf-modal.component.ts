import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as FileSaver from 'file-saver';

export interface IPDFInforme {
    src: string;
    title: string;
    nroLote?: string;
}

@Component({
    selector: 'pdf-modal',
    templateUrl: 'pdf-modal.component.html',
    styleUrls: ['./pdf-modal.component.scss']
})
export class PDFModalComponent implements OnInit {
    pdfSrc: string;
    currentIndex: number = 0;

    constructor(
        public dialogRef: MatDialogRef<PDFModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            src?: string;
            title?: string;
            showDownloadButton?: boolean;
            informes?: IPDFInforme[];
        },
    ) { }

    ngOnInit(): void {
        this.loadPdf();
    }

    loadPdf(): void {
        let base64 = '';
        if (this.data.informes && this.data.informes.length > 0) {
            base64 = this.data.informes[this.currentIndex].src;
        } else {
            base64 = this.data.src;
        }

        this.pdfSrc = 'data:application/pdf;base64,' + base64;
    }

    setInforme(index: number): void {
        this.currentIndex = index;
        this.loadPdf();
    }

    close(): void {
        this.dialogRef.close(false);
    }

    downloadPdf(): void {
        let src = '';
        let title = '';

        if (this.data.informes && this.data.informes.length > 0) {
            src = this.data.informes[this.currentIndex].src;
            title = this.data.informes[this.currentIndex].title;
        } else {
            src = this.data.src;
            title = this.data.title;
        }

        if (src && title) {
            const byteString = atob(src);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: 'application/pdf' });
            FileSaver.saveAs(blob, title);
        }
    }

    shouldShowDownloadButton(): boolean {
        return this.data.showDownloadButton === true;
    }
}