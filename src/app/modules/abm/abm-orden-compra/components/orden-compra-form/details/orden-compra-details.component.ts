import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Observable, Subject, combineLatest } from 'rxjs';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { startWith, debounceTime, switchMap, map, takeUntil } from 'rxjs/operators';
import { AbmOrdenCompraService } from '../../../abm-orden-compra.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import * as moment from 'moment';

@Component({
    selector: 'app-orden-compra-details',
    templateUrl: './orden-compra-details.component.html',
    styleUrls: ['./orden-compra-details.component.scss']
})
export class OrdenCompraDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('splitContainer') splitContainer: ElementRef;
    @ViewChild('piezaInput', { read: MatAutocompleteTrigger }) piezaAutocompleteTrigger: MatAutocompleteTrigger;

    @Input() mode: 'create' | 'view' | 'edit' = 'create';
    @Input() form: FormGroup;
    @Input() piezaForm: FormGroup;
    @Input() piezasAgregadas: any[] = [];
    @Input() pdfPreviewUrl: SafeResourceUrl | null = null;
    @Input() isImagePreview: boolean = false;
    
    @Output() piecesChanged = new EventEmitter<any[]>();

    isLoading: boolean = false;
    showItemForm: boolean = true;
    isEditingItem: boolean = false;
    splitDirection: 'row' | 'column' = 'row';
    splitSize: number = 50;
    isResizing: boolean = false;
    
    imageZoom: number = 1;
    imageRotation: number = 0;
    imagePanX: number = 0;
    imagePanY: number = 0;
    isDraggingImage: boolean = false;
    startDragX: number = 0;
    startDragY: number = 0;

    piezaCotizacionInfo: any = null;
    filteredPiezas$: Observable<any[]>;
    minDate: Date = new Date();
    
    auxiliarValor: number | string | null = null;
    auxiliarTexto: string = '';
    
    deliveryOptions = [
        { label: '15 días', value: 15, calculate: () => moment().startOf('day').add(15, 'days') },
        { label: '30 días', value: 30, calculate: () => moment().startOf('day').add(30, 'days') },
        { label: '45 días', value: 45, calculate: () => moment().startOf('day').add(45, 'days') },
        { label: '60 días', value: 60, calculate: () => moment().startOf('day').add(60, 'days') },
        { label: '90 días', value: 90, calculate: () => moment().startOf('day').add(90, 'days') },
    ];

    dateFilter = (d: any | null): boolean => {
        if (!d) return true;
        const day = moment(d).day();
        return day !== 0 && day !== 6;
    };

    private _isUpdatingDate: boolean = false;

    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _service: AbmOrdenCompraService,
        private _notification: NotificationService,
        private _dialog: MatDialog,
        private _cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.setupObservers();
    }

    private setupObservers(): void {
        this.filteredPiezas$ = combineLatest([
            this.piezaForm.get('pieza').valueChanges.pipe(startWith('')),
            this.piezaForm.get('soloDelCliente').valueChanges.pipe(startWith(true))
        ]).pipe(
            debounceTime(300),
            switchMap(([val, solo]) => {
                const term = typeof val === 'string' ? val : '';
                const clienteId = this.form.get('cliente').value?.id;
                return this._service.getPiezasCombo(solo ? clienteId : null, term).pipe(
                    map(res => res.data || [])
                );
            })
        );

        this.piezaForm.get('actualizarCotizacion').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((isUpdating) => {
            if (isUpdating) {
                this.piezaForm.patchValue({ cotizacionValor: null, cotizacionFecha: null });
            } else if (this.piezaCotizacionInfo) {
                this.piezaForm.patchValue({
                    cotizacionValor: this.piezaCotizacionInfo.valor ? this.piezaCotizacionInfo.valor.toFixed(3) : null,
                    cotizacionFecha: this.piezaCotizacionInfo.fecha
                });
            }
            this.updateCotizacionValidators();
        });

        this.piezaForm.get('fechaEntrega').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((date) => {
            if (this._isUpdatingDate) return;
            this.calculateAuxiliarFromDate(date);
        });
    }

    onAuxiliarChange(): void {
        if (!this.auxiliarValor) {
            return;
        }

        const option = this.deliveryOptions.find(o => o.value === this.auxiliarValor);
        if (!option) return;

        this._isUpdatingDate = true;
        let newDate = option.calculate();
        newDate = this.adjustToMonday(newDate);
        
        this.piezaForm.get('fechaEntrega').setValue(newDate.toDate());
        this.updateAuxiliarTexto();
        this._isUpdatingDate = false;
        this._cdr.detectChanges();
    }

    private adjustToMonday(m: moment.Moment): moment.Moment {
        const day = m.day();
        if (day === 6) { // Sábado
            return m.add(2, 'days');
        } else if (day === 0) { // Domingo
            return m.add(1, 'days');
        }
        return m;
    }

    private calculateAuxiliarFromDate(date: any): void {
        if (!date) {
            this.auxiliarValor = null;
            this.auxiliarTexto = '';
            return;
        }

        let deliveryDate = moment(date).startOf('day');
        const adjustedDate = this.adjustToMonday(moment(deliveryDate));
        
        if (!deliveryDate.isSame(adjustedDate, 'day')) {
            this._isUpdatingDate = true;
            this.piezaForm.get('fechaEntrega').setValue(adjustedDate.toDate());
            this._isUpdatingDate = false;
            deliveryDate = adjustedDate;
        }

        const matchedOption = this.deliveryOptions.find(opt => {
            const optDate = this.adjustToMonday(opt.calculate());
            return optDate.isSame(deliveryDate, 'day');
        });

        if (matchedOption) {
            this.auxiliarValor = matchedOption.value;
        } else {
            this.auxiliarValor = 'custom';
        }
        
        const today = moment().startOf('day');
        const diffDays = deliveryDate.diff(today, 'days');
        this.updateAuxiliarTexto(diffDays);
        this._cdr.detectChanges();
    }

    private updateAuxiliarTexto(days?: number): void {
        const d = days !== undefined ? days : (moment(this.piezaForm.get('fechaEntrega').value).diff(moment().startOf('day'), 'days'));
        
        if (isNaN(d) || d < 0) {
            this.auxiliarTexto = '';
            return;
        }

        if (d === 0) {
            this.auxiliarTexto = 'Hoy';
            return;
        }

        if (d < 30) {
            this.auxiliarTexto = d === 1 ? '1 Día' : `${d} Días`;
        } else {
            const months = Math.floor(d / 30);
            const remainingDays = d % 30;
            
            let text = months === 1 ? '1 Mes' : `${months} Meses`;
            if (remainingDays > 0) {
                text += remainingDays === 1 ? ' y 1 Día' : ` y ${remainingDays} Días`;
            }
            this.auxiliarTexto = text;
        }
    }

    onPiezaSelected(event: any): void {
        const pieza = event.option.value;
        const clienteId = this.form.get('cliente').value?.id;
        const exists = this.piezasAgregadas.find(g => g.idPieza === pieza.id);

        if (!clienteId) {
            this._notification.showError("Debe seleccionar un cliente primero");
            return;
        }

        this.isLoading = true;
        this._service.getCotizaciones(pieza.id, clienteId).subscribe(res => {
            const cotizacion = res.data?.page && res.data.page.length > 0 ? res.data.page[0] : null;

            if (cotizacion) {
                this.piezaCotizacionInfo = {
                    id: cotizacion.id,
                    tieneCotizacion: true,
                    valor: cotizacion.valor,
                    fecha: cotizacion.fecha ? moment(cotizacion.fecha, 'DD/MM/YYYY').toDate() : null
                };
            } else {
                this.piezaCotizacionInfo = { tieneCotizacion: false, valor: null, fecha: null };
            }

            if (exists) {
                this.piezaCotizacionInfo.tieneCotizacion = true;
                this.piezaCotizacionInfo.valor = exists.precio;
                this.piezaCotizacionInfo.fecha = exists.fechaCotizacion ? moment(exists.fechaCotizacion, 'DD/MM/YYYY').toDate() : null;
            }

            this.piezaForm.patchValue({
                cotizacionValor: this.piezaCotizacionInfo.valor ? this.piezaCotizacionInfo.valor.toFixed(3) : null,
                cotizacionFecha: this.piezaCotizacionInfo.fecha,
                actualizarCotizacion: false
            }, { emitEvent: false });

            this.updateCotizacionValidators();
            this.isLoading = false;
            this._cdr.detectChanges();
        }, () => {
            this.isLoading = false;
            this._notification.showError("Error al obtener la cotización");
        });
    }

    addOrUpdatePieza(continueAdding: boolean): void {
        if (this.piezaForm.invalid) { 
            this.piezaForm.markAllAsTouched(); 
            this._notification.showError("Por favor, complete todos los campos obligatorios del producto");
            return; 
        }

        const p = this.piezaForm.getRawValue();
        const precio = parseFloat(p.cotizacionValor || 0);
        const idCotiz = p.actualizarCotizacion ? null : (this.piezaCotizacionInfo?.id || null);

        let grupo = this.piezasAgregadas.find(g => g.idPieza === p.pieza.id);
        const batch = {
            idTemp: p.idTemp || Date.now(),
            cantidadSolicitada: p.cantidadSolicitada,
            fechaEntrega: p.fechaEntrega ? moment(p.fechaEntrega).format('DD/MM/YYYY') : '',
            isEditing: false
        };
        const fechaCotiz = p.cotizacionFecha ? moment(p.cotizacionFecha).format('DD/MM/YYYY') : '';

        if (grupo) {
            const batchIndex = grupo.batches.findIndex(b => b.idTemp === batch.idTemp);
            if (batchIndex > -1) { grupo.batches[batchIndex] = batch; }
            else { grupo.batches.push(batch); }
            grupo.idCotizacion = idCotiz;
            grupo.precio = precio;
            grupo.fechaCotizacion = fechaCotiz;
            grupo.esActualizacion = p.actualizarCotizacion;
        } else {
            grupo = {
                idPieza: p.pieza.id, codigo: p.pieza.codigo, denominacion: p.pieza.denominacion,
                idCotizacion: idCotiz, precio: precio, fechaCotizacion: fechaCotiz,
                esActualizacion: p.actualizarCotizacion, batches: [batch]
            };
            this.piezasAgregadas.push(grupo);
        }

        this.piecesChanged.emit([...this.piezasAgregadas]);
        this.resetItemForm(true, continueAdding);

        if (continueAdding) {
            this.piezaForm.patchValue({ pieza: p.pieza, soloDelCliente: p.soloDelCliente });
            this.onPiezaSelected({ option: { value: p.pieza } });
        }
    }

    removePieza(indexGrupo: number): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Eliminar ítem', message: '¿Está seguro de que desea eliminar todos los registros de esta pieza?',
                showConfirmButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.piezasAgregadas.splice(indexGrupo, 1);
                this.piecesChanged.emit([...this.piezasAgregadas]);
                this._notification.showSuccess("Pieza eliminada");
            }
        });
    }

    removeBatch(grupo: any, indexBatch: number): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Eliminar entrega', message: '¿Está seguro de que desea eliminar esta entrega específica?',
                showConfirmButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                grupo.batches.splice(indexBatch, 1);
                if (grupo.batches.length === 0) {
                    const idx = this.piezasAgregadas.indexOf(grupo);
                    this.piezasAgregadas.splice(idx, 1);
                }
                this.piecesChanged.emit([...this.piezasAgregadas]);
                this._notification.showSuccess("Entrega eliminada");
            }
        });
    }

    editBatch(batch: any): void {
        batch.isEditing = true;
        batch.tempCantidad = batch.cantidadSolicitada;
        batch.tempFecha = batch.fechaEntrega ? moment(batch.fechaEntrega, 'DD/MM/YYYY') : null;
    }

    saveBatch(batch: any): void {
        if (batch.tempCantidad > 0 && batch.tempFecha) {
            batch.cantidadSolicitada = batch.tempCantidad;
            batch.fechaEntrega = moment(batch.tempFecha).format('DD/MM/YYYY');
            batch.isEditing = false;
            this.piecesChanged.emit([...this.piezasAgregadas]);
        } else {
            this._notification.showError("Cantidad y Fecha de entrega son requeridas");
        }
    }

    selectPieceFromCard(grupo: any): void {
        this.showItemForm = true;
        this.piezaForm.reset({ soloDelCliente: true });
        this.piezaForm.patchValue({
            pieza: { id: grupo.idPieza, codigo: grupo.codigo, denominacion: grupo.denominacion },
            cantidadSolicitada: null, fechaEntrega: null
        });
        this.onPiezaSelected({ option: { value: { id: grupo.idPieza } } });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editQuotation(grupo: any): void {
        grupo.isEditingQuotation = true;
        grupo.tempPrecio = grupo.precio ? grupo.precio.toFixed(3) : '0.000';
        grupo.tempFecha = grupo.fechaCotizacion ? moment(grupo.fechaCotizacion, 'DD/MM/YYYY') : null;
    }

    saveQuotation(grupo: any): void {
        grupo.precio = parseFloat(grupo.tempPrecio || 0);
        grupo.fechaCotizacion = grupo.tempFecha ? moment(grupo.tempFecha).format('DD/MM/YYYY') : '';
        grupo.isEditingQuotation = false;
        grupo.esActualizacion = true;
        grupo.idCotizacion = null;
        this.piecesChanged.emit([...this.piezasAgregadas]);
    }

    cancelQuotationEdit(grupo: any): void { grupo.isEditingQuotation = false; }

    resetItemForm(show: boolean, openAutocomplete: boolean = true): void {
        this.piezaForm.reset({ soloDelCliente: true });
        this.isEditingItem = false;
        this.piezaCotizacionInfo = null;
        this.auxiliarValor = null;
        this.auxiliarTexto = '';
        this.showItemForm = show;
        if (show && openAutocomplete) {
            setTimeout(() => { this.piezaAutocompleteTrigger?.openPanel(); });
        }
        this._cdr.detectChanges();
    }

    clearPiezaSelection(): void {
        this.piezaForm.get('pieza').setValue('');
        this.piezaCotizacionInfo = null;
        setTimeout(() => { this.piezaAutocompleteTrigger?.openPanel(); });
    }

    startResizing(event: MouseEvent): void { event.preventDefault(); this.isResizing = true; }

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
        }

        if (this.isDraggingImage) {
            this.imagePanX = event.clientX - this.startDragX;
            this.imagePanY = event.clientY - this.startDragY;
            this._cdr.markForCheck();
        }
    }

    @HostListener('window:mouseup')
    onMouseUp(): void {
        this.isResizing = false;
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

    formatCurrency(value: number): string {
        if (value === null || value === undefined) return 'U$D 0.000';
        return 'U$D ' + value.toFixed(3);
    }

    onPriceInput(event: any, controlName: string): void {
        let val = event.target.value;
        if (val.includes(',')) {
            val = val.replace(',', '.');
            this.piezaForm.get(controlName).setValue(val, { emitEvent: false });
        }
    }

    onPriceInputCard(event: any, grupo: any): void {
        let val = event.target.value;
        if (val.includes(',')) {
            val = val.replace(',', '.');
            grupo.tempPrecio = val;
        }
    }

    displayFn(i: any): string { return i ? (i.nombre || i.denominacion) : ''; }
    get imageZoomPercent(): string { return Math.round(this.imageZoom * 100) + '%'; }
    get precioUnitarioActual(): number { 
        const val = this.piezaForm.get('cotizacionValor').value;
        return this.piezaCotizacionInfo?.tieneCotizacion && !this.piezaForm.get('actualizarCotizacion').value ? 
            this.piezaCotizacionInfo.valor : parseFloat(val || 0); 
    }
    get precioTotalItem(): number { return (this.piezaForm.get('cantidadSolicitada').value || 0) * this.precioUnitarioActual; }

    private updateCotizacionValidators(): void {
        const val = this.piezaForm.get('cotizacionValor');
        const fec = this.piezaForm.get('cotizacionFecha');
        const isUpdating = this.piezaForm.get('actualizarCotizacion').value;

        if (this.piezaCotizacionInfo && (!this.piezaCotizacionInfo.tieneCotizacion || isUpdating)) {
            val.setValidators([Validators.required, Validators.min(0.01)]);
            fec.setValidators([Validators.required]);
        } else {
            val.clearValidators(); fec.clearValidators();
        }
        val.updateValueAndValidity(); fec.updateValueAndValidity();
    }

    setShowItemForm(val: boolean): void {
        this.showItemForm = val;
        this._cdr.detectChanges();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
