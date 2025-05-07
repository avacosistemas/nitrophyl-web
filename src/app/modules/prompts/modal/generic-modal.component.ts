import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface DialogData {
    title?: string;
    message: SafeHtml;
    icon?: string;
    showCloseButton?: boolean;
    showConfirmButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    customContent?: string;
    type?: 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error' | 'default';
}

@Component({
    selector: 'app-generic-modal',
    templateUrl: './generic-modal.component.html',
    styleUrls: ['./generic-modal.component.scss']
})
export class GenericModalComponent {
    public sanitizedContent: SafeHtml;

    constructor(
        public dialogRef: MatDialogRef<GenericModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private sanitizer: DomSanitizer
    ) {
        if (data.customContent) {
            this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(data.customContent);
        }
    }

    onConfirm(): void {
        if (this.data.onConfirm) {
            this.data.onConfirm();
        }
        this.dialogRef.close(true);
    }

    onCancel(): void {
        if (this.data.onCancel) {
            this.data.onCancel();
        }
        this.dialogRef.close(false);
    }

    onClose(): void {
        this.dialogRef.close(false);
    }
}