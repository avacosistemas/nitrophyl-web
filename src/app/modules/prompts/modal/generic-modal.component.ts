import { Component, Inject, ViewChild, ViewContainerRef, ComponentFactoryResolver, AfterViewInit, Type } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface CustomModalComponentWithValue {
    getValue(): any;
}

interface DialogData {
    title?: string;
    message: SafeHtml | string;
    icon?: string;
    showCloseButton?: boolean;
    showConfirmButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    customComponent?: Type<any>;
    type?: 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error' | 'default';
    componentData?: any;
}

@Component({
    selector: 'app-generic-modal',
    templateUrl: './generic-modal.component.html',
    styleUrls: ['./generic-modal.component.scss']
})
export class GenericModalComponent implements AfterViewInit {
    @ViewChild('customComponentContainer', { read: ViewContainerRef, static: true }) customComponentContainer: ViewContainerRef;

    private customComponentInstance: CustomModalComponentWithValue | null = null;
    public isCustomComponentValid: boolean = false;
    
    constructor(
        public dialogRef: MatDialogRef<GenericModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private sanitizer: DomSanitizer,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
        if (typeof data.message === 'string') {
            this.data.message = this.sanitizer.bypassSecurityTrustHtml(data.message);
        }
    }

    ngAfterViewInit() {
        if (this.data.customComponent) {
            setTimeout(() => {
                const factory = this.componentFactoryResolver.resolveComponentFactory(this.data.customComponent);
                const componentRef = this.customComponentContainer.createComponent(factory);
                this.customComponentInstance = componentRef.instance as CustomModalComponentWithValue;

                if (this.data.componentData) {
                    Object.assign(this.customComponentInstance, this.data.componentData);
                }
            });
        }
    }

    onConfirm(): void {
        if (this.customComponentInstance && typeof this.customComponentInstance.getValue === 'function') {
            const result = this.customComponentInstance.getValue();

            if (result === null) {
                return;
            }

            this.dialogRef.close(result);
        } else {
            this.dialogRef.close(true);
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onClose(): void {
        this.dialogRef.close(false);
    }
}