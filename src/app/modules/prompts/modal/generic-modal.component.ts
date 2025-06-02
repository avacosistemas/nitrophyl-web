import { Component, Inject, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Type } from '@angular/core';

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
    customComponent?: Type<any>;
    type?: 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error' | 'default';
    componentData?: any;
}

@Component({
    selector: 'app-generic-modal',
    templateUrl: './generic-modal.component.html',
    styleUrls: ['./generic-modal.component.scss']
})
export class GenericModalComponent {
    @ViewChild('customComponentContainer', { read: ViewContainerRef }) customComponentContainer: ViewContainerRef;

    constructor(
        public dialogRef: MatDialogRef<GenericModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private sanitizer: DomSanitizer,
        private componentFactoryResolver: ComponentFactoryResolver
    ) { }

    ngAfterViewInit() {
        if (this.data.customComponent) {
            const factory = this.componentFactoryResolver.resolveComponentFactory(this.data.customComponent);
            const componentRef = this.customComponentContainer.createComponent(factory);

            if (this.data.componentData) {
                Object.assign(componentRef.instance, this.data.componentData);
            }

            componentRef.changeDetectorRef.detectChanges();
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