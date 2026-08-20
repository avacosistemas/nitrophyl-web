import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { startWith, debounceTime, switchMap, map, takeUntil } from 'rxjs/operators';
import { AbmOrdenCompraService } from '../../../../abm-orden-compra.service';
import { NotificationService } from 'app/shared/services/notification.service';
import moment from 'moment';

@Component({
    selector: 'app-orden-compra-pieza-form',
    templateUrl: './orden-compra-pieza-form.component.html',
    styleUrls: ['./orden-compra-pieza-form.component.scss']
})
export class OrdenCompraPiezaFormComponent implements OnInit, OnDestroy {
    @ViewChild('piezaInput', { read: MatAutocompleteTrigger }) piezaAutocompleteTrigger!: MatAutocompleteTrigger;

    @Input() mode: 'create' | 'view' | 'edit' = 'create';
    @Input() form!: FormGroup;
    @Input() piezaForm!: FormGroup;
    @Input() piezasAgregadas: any[] = [];

    @Output() piecesChanged = new EventEmitter<any[]>();

    isLoading: boolean = false;
    isEditingItem: boolean = false;
    piezaCotizacionInfo: any = null;
    filteredPiezas$!: Observable<any[]>;
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
        private _cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.setupObservers();
    }

    private setupObservers(): void {
        this.filteredPiezas$ = combineLatest([
            this.piezaForm.get('pieza')!.valueChanges.pipe(startWith('')),
            this.piezaForm.get('soloDelCliente')!.valueChanges.pipe(startWith(true))
        ]).pipe(
            debounceTime(300),
            switchMap(([val, solo]) => {
                const term = typeof val === 'string' ? val : '';
                const clienteId = this.form.get('cliente')!.value?.id;
                return this._service.getPiezasCombo(solo ? clienteId : null, term).pipe(
                    map(res => res.data || [])
                );
            })
        );

        this.piezaForm.get('actualizarCotizacion')!.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((isUpdating) => {
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

        this.piezaForm.get('fechaEntrega')!.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((date) => {
            if (this._isUpdatingDate) return;
            this.calculateAuxiliarFromDate(date);
        });

        this.piezaForm.get('aplicarDescuento')!.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((apply) => {
            const descCtrl = this.piezaForm.get('descuento')!;
            if (apply) {
                descCtrl.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
            } else {
                descCtrl.clearValidators();
                descCtrl.setValue(null);
            }
            descCtrl.updateValueAndValidity();
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
        
        this.piezaForm.get('fechaEntrega')!.setValue(newDate.toDate());
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

        const mDate = moment(date);
        if (!mDate.isValid()) {
            this.auxiliarValor = null;
            this.auxiliarTexto = '';
            return;
        }

        const deliveryDate = mDate.startOf('day');

        const matchedOption = this.deliveryOptions.find(opt => {
            const optDate = this.adjustToMonday(opt.calculate());
            return optDate.isSame(this.adjustToMonday(moment(deliveryDate)), 'day');
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
        const d = days !== undefined ? days : (moment(this.piezaForm.get('fechaEntrega')!.value).diff(moment().startOf('day'), 'days'));
        
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
        const clienteId = this.form.get('cliente')!.value?.id;
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

    selectPiece(grupo: any): void {
        this.piezaForm.reset({ soloDelCliente: true });
        this.piezaForm.patchValue({
            pieza: { id: grupo.idPieza, codigo: grupo.codigo, denominacion: grupo.denominacion },
            cantidadSolicitada: null,
            fechaEntrega: null,
            observacion: grupo.observacion || '',
            aplicarDescuento: grupo.descuento !== null && grupo.descuento !== undefined,
            descuento: grupo.descuento || null,
            observacionDescuento: grupo.observacionDescuento || ''
        });
        this.onPiezaSelected({ option: { value: { id: grupo.idPieza } } });
    }

    onFormEnter(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        if (this.piezaForm.valid) {
            this.addOrUpdatePieza(false);
        }
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
        const desc = p.aplicarDescuento ? parseFloat(p.descuento || 0) : null;

        let grupo = this.piezasAgregadas.find(g => g.idPieza === p.pieza.id);
        const batch = {
            idTemp: p.idTemp || Date.now(),
            cantidadSolicitada: p.cantidadSolicitada,
            fechaEntrega: p.fechaEntrega ? moment(p.fechaEntrega).format('DD/MM/YYYY') : '',
            isEditing: false
        };
        const fechaCotiz = p.cotizacionFecha ? moment(p.cotizacionFecha).format('DD/MM/YYYY') : '';

        if (grupo) {
            const batchIndex = grupo.batches.findIndex((b: any) => b.idTemp === batch.idTemp);
            if (batchIndex > -1) { grupo.batches[batchIndex] = batch; }
            else { grupo.batches.push(batch); }
            grupo.idCotizacion = idCotiz;
            grupo.precio = precio;
            grupo.fechaCotizacion = fechaCotiz;
            grupo.esActualizacion = p.actualizarCotizacion;
            grupo.observacion = p.observacion || '';
            grupo.observacionDescuento = p.observacionDescuento || '';
            grupo.descuento = desc;
        } else {
            grupo = {
                idPieza: p.pieza.id, codigo: p.pieza.codigo, denominacion: p.pieza.denominacion,
                idCotizacion: idCotiz, precio: precio, fechaCotizacion: fechaCotiz,
                esActualizacion: p.actualizarCotizacion, batches: [batch],
                observacion: p.observacion || '',
                observacionDescuento: p.observacionDescuento || '',
                descuento: desc
            };
            this.piezasAgregadas.push(grupo);
        }

        this.piecesChanged.emit([...this.piezasAgregadas]);

        this._notification.showSuccess(`Pieza agregada al listado`);

        this.resetItemForm(continueAdding);

        if (continueAdding) {
            this.piezaForm.patchValue({ pieza: p.pieza, soloDelCliente: p.soloDelCliente });
            this.onPiezaSelected({ option: { value: p.pieza } });
        }
    }

    resetItemForm(openAutocomplete: boolean = true): void {
        this.piezaForm.reset({ soloDelCliente: true, aplicarDescuento: false, descuento: null, observacion: '', observacionDescuento: '' });
        this.isEditingItem = false;
        this.piezaCotizacionInfo = null;
        this.auxiliarValor = null;
        this.auxiliarTexto = '';
        if (openAutocomplete) {
            setTimeout(() => { this.piezaAutocompleteTrigger?.openPanel(); });
        }
        this._cdr.detectChanges();
    }

    clearPiezaSelection(): void {
        this.piezaForm.get('pieza')!.setValue('');
        this.piezaCotizacionInfo = null;
        setTimeout(() => { this.piezaAutocompleteTrigger?.openPanel(); });
    }

    formatCurrency(value: number): string {
        if (value === null || value === undefined) return 'U$D 0.000';
        return 'U$D ' + value.toFixed(3);
    }

    onPriceInput(event: any, controlName: string): void {
        let val = event.target.value;
        if (val.includes(',')) {
            val = val.replace(',', '.');
            this.piezaForm.get(controlName)!.setValue(val, { emitEvent: false });
        }
    }

    displayFn(i: any): string { return i ? (i.nombre || i.denominacion) : ''; }
    get precioUnitarioActual(): number { 
        const val = this.piezaForm.get('cotizacionValor')!.value;
        return this.piezaCotizacionInfo?.tieneCotizacion && !this.piezaForm.get('actualizarCotizacion')!.value ? 
            this.piezaCotizacionInfo.valor : parseFloat(val || 0); 
    }
    get precioSubtotalItem(): number {
        return (this.piezaForm.get('cantidadSolicitada')!.value || 0) * this.precioUnitarioActual;
    }

    get precioDescuentoCalculado(): number {
        const aplicar = this.piezaForm.get('aplicarDescuento')?.value;
        const desc = parseFloat(this.piezaForm.get('descuento')?.value || 0);
        if (aplicar && desc > 0) {
            return this.precioUnitarioActual - (this.precioUnitarioActual * (desc / 100));
        }
        return 0;
    }

    get precioTotalItem(): number { 
        return this.precioSubtotalItem - this.precioDescuentoCalculado;
    }

    private updateCotizacionValidators(): void {
        const val = this.piezaForm.get('cotizacionValor')!;
        const fec = this.piezaForm.get('cotizacionFecha')!;
        const isUpdating = this.piezaForm.get('actualizarCotizacion')!.value;

        if (this.piezaCotizacionInfo && (!this.piezaCotizacionInfo.tieneCotizacion || isUpdating)) {
            val.setValidators([Validators.required, Validators.min(0.01)]);
            fec.setValidators([Validators.required]);
        } else {
            val.clearValidators(); fec.clearValidators();
        }
        val.updateValueAndValidity(); fec.updateValueAndValidity();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
