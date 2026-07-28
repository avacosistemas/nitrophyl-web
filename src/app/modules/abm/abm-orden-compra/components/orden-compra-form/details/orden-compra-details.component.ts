import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MatTabGroup } from '@angular/material/tabs';
import { OrdenCompraPiezaFormComponent } from './pieza-form/orden-compra-pieza-form.component';

@Component({
    selector: 'app-orden-compra-details',
    templateUrl: './orden-compra-details.component.html',
    styleUrls: ['./orden-compra-details.component.scss']
})
export class OrdenCompraDetailsComponent {
    @ViewChild('splitContainer') splitContainer!: ElementRef;
    @ViewChild(OrdenCompraPiezaFormComponent) piezaFormComponent!: OrdenCompraPiezaFormComponent;
    @ViewChild(MatTabGroup) tabGroup?: MatTabGroup;

    @Input() mode: 'create' | 'view' | 'edit' = 'create';
    @Input() form!: FormGroup;
    @Input() piezaForm!: FormGroup;
    @Input() piezasAgregadas: any[] = [];
    @Input() pdfPreviewUrl: SafeResourceUrl | null = null;
    @Input() isImagePreview: boolean = false;
    
    @Output() piecesChanged = new EventEmitter<any[]>();

    splitDirection: 'row' | 'column' = 'row';
    splitSize: number = 50;
    isResizing: boolean = false;
    activeTabIndex: number = 0;
    
    imageZoom: number = 1;
    imageRotation: number = 0;
    imagePanX: number = 0;
    imagePanY: number = 0;
    isDraggingImage: boolean = false;
    startDragX: number = 0;
    startDragY: number = 0;

    constructor(private _cdr: ChangeDetectorRef) { }

    onSelectPiece(grupo: any): void {
        this.activeTabIndex = 0;
        this._cdr.detectChanges();
        setTimeout(() => {
            this.piezaFormComponent?.selectPiece(grupo);
        });
    }

    startResizing(event: MouseEvent): void { 
        event.preventDefault(); 
        this.isResizing = true; 
    }

    @HostListener('window:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (this.isResizing && this.splitContainer) {
            const rect = this.splitContainer.nativeElement.getBoundingClientRect();
            if (this.splitDirection === 'row') {
                const perc = ((event.clientX - rect.left) / rect.width) * 100;
                if (perc > 10 && perc < 90) this.splitSize = perc;
            } else {
                const perc = ((event.clientY - rect.top) / rect.height) * 100;
                if (perc > 10 && perc < 90) this.splitSize = perc;
            }
            this._cdr.markForCheck();
            if (this.tabGroup) {
                this.tabGroup.realignInkBar();
            }
        }

        if (this.isDraggingImage) {
            this.imagePanX = event.clientX - this.startDragX;
            this.imagePanY = event.clientY - this.startDragY;
            this._cdr.markForCheck();
        }
    }

    @HostListener('window:mouseup')
    onMouseUp(): void {
        if (this.isResizing) {
            this.isResizing = false;
            if (this.tabGroup) {
                this.tabGroup.realignInkBar();
            }
        }
        this.isDraggingImage = false;
    }

    onImageWheel(event: WheelEvent): void {
        const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
        this.imageZoom = Math.max(0.1, Math.min(this.imageZoom + zoomDelta, 5));
    }

    onImageMouseDown(event: MouseEvent): void {
        event.preventDefault();
        this.isDraggingImage = true;
        this.startDragX = event.clientX - this.imagePanX;
        this.startDragY = event.clientY - this.imagePanY;
    }

    zoomInImage(): void { this.imageZoom = Math.min(this.imageZoom + 0.2, 5); }
    zoomOutImage(): void { this.imageZoom = Math.max(this.imageZoom - 0.2, 0.1); }
    rotateImageLeft(): void { this.imageRotation -= 90; }
    rotateImageRight(): void { this.imageRotation += 90; }
    resetImageView(): void { this.imageZoom = 1; this.imageRotation = 0; this.imagePanX = 0; this.imagePanY = 0; }
    toggleSplit(): void { this.splitDirection = this.splitDirection === 'row' ? 'column' : 'row'; this.splitSize = 50; }

    get imageZoomPercent(): string { return Math.round(this.imageZoom * 100) + '%'; }
}
