import { Component, OnDestroy, OnInit, ViewEncapsulation, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject, Observable, combineLatest, of } from 'rxjs';
import { takeUntil, startWith, map, debounceTime, switchMap, catchError, tap } from 'rxjs/operators';
import { AbmOrdenFabricacionService } from '../../abm-orden-fabricacion.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import * as moment from 'moment';

@Component({
    selector: 'app-orden-fabricacion-form',
    templateUrl: './orden-fabricacion-form.component.html',
    styleUrls: ['./orden-fabricacion-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OrdenFabricacionFormComponent implements OnInit, OnDestroy {
    @ViewChild('splitContainer') set splitContainerContent(content: ElementRef) {
        if (content) { this.splitContainer = content; }
    }
    private splitContainer: ElementRef;

    private _piezaAutocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild(MatAutocompleteTrigger) set piezaAutocompleteTrigger(v: MatAutocompleteTrigger) {
        this._piezaAutocompleteTrigger = v;
    }
    private _clienteAutocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) set clienteAutocompleteTrigger(v: MatAutocompleteTrigger) {
        this._clienteAutocompleteTrigger = v;
    }

    step: 'header' | 'items' = 'header';
    splitDirection: 'row' | 'column' = 'row';
    showItemForm: boolean = true;
    isEditingItem: boolean = false;

    isResizing: boolean = false;
    splitSize: number = 50;

    form: FormGroup;
    piezaForm: FormGroup;
    isClienteExterno: boolean = false;
    pdfPreviewUrl: SafeResourceUrl | null = null;
    isLoading: boolean = false;

    clientes: any[] = [
        { id: null, nombre: 'NITROPHYL' },
        { id: 1, nombre: 'Cliente 1', codigo: 'CL01' },
        { id: 2, nombre: 'Cliente 2', codigo: 'CL22' }
    ];

    filteredClientes$: Observable<any[]>;
    ordenesCompra$: Observable<any[]> = of([]);
    filteredPiezas$: Observable<any[]>;

    piezasAgregadas: any[] = [];
    piezaStockInfo: any = null;
    piezaCotizacionInfo: any = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _fb: FormBuilder,
        private _ofService: AbmOrdenFabricacionService,
        private _sanitizer: DomSanitizer,
        private _notification: NotificationService,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initForms();
        this.setupObservers();
        this.updateHeaderUI();

        this.piezaForm.get('cantidadSolicitada').valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(val => {
                this.recalcularTodo();
            });
    }

    recalcularTodo(): void {
        const solicitado = this.piezaForm.get('cantidadSolicitada').value || 0;
        const stock = this.piezaStockInfo?.stock || 0;

        const aFabricar = Math.max(0, solicitado - stock);
        this.piezaForm.get('cantidadAFabricar').setValue(aFabricar, { emitEvent: false });

        this._changeDetectorRef.markForCheck();
        this._changeDetectorRef.detectChanges();
    }

    private initForms(): void {
        this.form = this._fb.group({
            cliente: [null, Validators.required],
            ordenCompra: [null],
            fecha: [new Date(), Validators.required]
        });

        this.piezaForm = this._fb.group({
            idTemp: [null],
            pieza: [null, Validators.required],
            soloDelCliente: [true],
            cantidadSolicitada: [null, [Validators.required, Validators.min(1)]],
            cantidadAFabricar: [null, [Validators.required, Validators.min(0)]],
            cotizacionValor: [null],
            cotizacionFecha: [null]
        });
    }

    private setupObservers(): void {
        this._ofService.actionTriggered$.pipe(takeUntil(this._unsubscribeAll)).subscribe(action => {
            if (action === 'confirmHeader') this.onConfirmHeader();
            if (action === 'editHeader') { this.step = 'header'; this.updateHeaderUI(); }
            if (action === 'toggleSplit') this.toggleSplit();
            if (action === 'saveAll') this.onSaveAll();
            if (action === 'goBack') this._router.navigate(['/orden-fabricacion/list']);
        });

        this.form.get('ordenCompra').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(oc => {
            if (oc?.archivoContenido) {
                const url = `data:application/pdf;base64,${oc.archivoContenido}`;
                this.pdfPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(url);
            } else {
                this.pdfPreviewUrl = null;
            }
            this._changeDetectorRef.markForCheck();
        });

        this.filteredClientes$ = this.form.get('cliente').valueChanges.pipe(
            startWith(''),
            map(val => this._filter(val, this.clientes))
        );

        this.filteredPiezas$ = combineLatest([
            this.piezaForm.get('pieza').valueChanges.pipe(startWith('')),
            this.piezaForm.get('soloDelCliente').valueChanges.pipe(startWith(true))
        ]).pipe(
            debounceTime(300),
            switchMap(([val, soloDelCliente]) => {
                const term = typeof val === 'string' ? val : '';
                const cliente = this.form.get('cliente').value;

                return this._ofService.getPiezas(cliente?.id, soloDelCliente).pipe(
                    map(res => {
                        const piezas = res?.data || [];
                        if (!term.trim()) return piezas;

                        return piezas.filter(p =>
                            p.denominacion.toLowerCase().includes(term.toLowerCase()) ||
                            p.codigo.toLowerCase().includes(term.toLowerCase())
                        );
                    })
                );
            })
        );

        this.piezaForm.get('cantidadSolicitada').valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(val => {
                const stock = this.piezaStockInfo?.stock || 0;
                this.piezaForm.get('cantidadAFabricar').setValue(Math.max(0, (val || 0) - stock), { emitEvent: false });
            });
    }

    clearPiezaSelection(): void {
        this.piezaForm.get('pieza').setValue('', { emitEvent: true });

        this.resetStockAndCotizacion();
        this.piezaStockInfo = { stock: 0 };

        this._changeDetectorRef.detectChanges();

        setTimeout(() => {
            if (this._piezaAutocompleteTrigger) {
                this._piezaAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    clearClientSelection(): void {
        this.form.get('cliente').setValue('', { emitEvent: true });

        this.onClientSelected({ option: { value: null } });

        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this._clienteAutocompleteTrigger) {
                this._clienteAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    onPiezaSelected(event: any): void {
        const pieza = event.option.value;
        const cliente = this.form.get('cliente').value;

        if (!pieza) {
            this.resetStockAndCotizacion();
            return;
        }

        this.isLoading = true;

        this._ofService.getPiezaStock(pieza.id).subscribe(res => {
            this.piezaStockInfo = res.data;

            this.recalcularTodo();

            this.isLoading = false;
            this._changeDetectorRef.detectChanges();
        });

        if (!this.isClienteExterno) {
            this.piezaCotizacionInfo = { tieneCotizacion: true, valor: 0, fecha: 'N/A' };
            this.updateCotizacionValidators();
            this._changeDetectorRef.detectChanges();
        } else {
            this._ofService.getPiezaCotizacion(pieza.id, cliente?.id).subscribe(res => {
                this.piezaCotizacionInfo = res.data;
                this.updateCotizacionValidators();
                this._changeDetectorRef.detectChanges();
            });
        }
    }

    startResizing(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isResizing = true;
    }

    @HostListener('window:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (!this.isResizing || !this.splitContainer) return;

        const containerRect = this.splitContainer.nativeElement.getBoundingClientRect();

        if (this.splitDirection === 'row') {
            const relativeX = event.clientX - containerRect.left;
            const percentage = (relativeX / containerRect.width) * 100;
            if (percentage > 10 && percentage < 90) {
                this.splitSize = percentage;
            }
        } else {
            const relativeY = event.clientY - containerRect.top;
            const percentage = (relativeY / containerRect.height) * 100;
            if (percentage > 10 && percentage < 90) {
                this.splitSize = percentage;
            }
        }
        this._changeDetectorRef.markForCheck();
    }

    @HostListener('window:mouseup')
    onMouseUp(): void {
        this.isResizing = false;
    }

    toggleSplit(): void {
        this.splitDirection = this.splitDirection === 'row' ? 'column' : 'row';
        this.splitSize = 50;
    }

    onClientSelected(event: any): void {
        const cliente = event.option.value;
        this.isClienteExterno = (cliente && cliente.id !== null);
        this.form.get('ordenCompra').reset();
        this.pdfPreviewUrl = null;

        if (this.isClienteExterno) {
            this.isLoading = true;
            this.ordenesCompra$ = this._ofService.getOrdenesCompraPorCliente(cliente.id).pipe(
                tap(() => { this.isLoading = false; this._changeDetectorRef.markForCheck(); }),
                map(res => res.data),
                catchError(() => { this.isLoading = false; return of([]); })
            );
        } else {
            this.ordenesCompra$ = of([]);
        }
    }

    onConfirmHeader(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.step = 'items';
        this.showItemForm = true;
        this.updateHeaderUI();
    }

    updateHeaderUI(): void {
        let btns = [];
        let sub = '';

        if (this.step === 'header') {
            btns = [
                { type: 'stroked', label: 'Cancelar', condition: true, action: 'goBack' },
                { type: 'flat', label: 'Confirmar y Continuar', condition: true, action: 'confirmHeader' }
            ];
            this._ofService.updateHeaderSubtitle('');
        } else {
            btns = [
                { type: 'stroked', label: 'Volver Atrás', condition: true, action: 'editHeader' },
                { type: 'stroked', label: 'Invertir Vista', condition: this.isClienteExterno, action: 'toggleSplit' },
                { type: 'flat', label: 'Finalizar Orden', condition: true, action: 'saveAll' }
            ];

            const clienteNombre = this.form.get('cliente').value?.nombre || '';
            const fecha = moment(this.form.get('fecha').value).format('DD/MM/YYYY');
            sub = `${clienteNombre} | Fecha de Orden: ${fecha}`;
            this._ofService.updateHeaderSubtitle(sub);
        }
        this._ofService.updateHeaderButtons(btns);
    }

    resetStockAndCotizacion(): void {
        this.piezaStockInfo = null;
        this.piezaCotizacionInfo = null;
        this.piezaForm.get('cotizacionValor').reset();
        this.piezaForm.get('cotizacionFecha').reset();
        this.updateCotizacionValidators();
    }

    get precioUnitarioActual(): number {
        if (this.piezaCotizacionInfo?.tieneCotizacion) {
            return this.piezaCotizacionInfo.valor;
        }
        return this.piezaForm.get('cotizacionValor').value || 0;
    }

    private updateCotizacionValidators(): void {
        const val = this.piezaForm.get('cotizacionValor');
        const fec = this.piezaForm.get('cotizacionFecha');

        if (this.isClienteExterno && this.piezaCotizacionInfo && !this.piezaCotizacionInfo.tieneCotizacion) {
            val.setValidators([Validators.required, Validators.min(0.01)]);
            fec.setValidators([Validators.required]);
        } else {
            val.clearValidators();
            fec.clearValidators();
        }
        val.updateValueAndValidity();
        fec.updateValueAndValidity();
    }

    addOrUpdatePieza(continueAdding: boolean): void {
        if (this.piezaForm.invalid) {
            this.piezaForm.markAllAsTouched();
            return;
        }
        const p = this.piezaForm.getRawValue();
        const item = {
            idTemp: p.idTemp || Date.now(),
            idPieza: p.pieza.id,
            codigo: p.pieza.codigo,
            denominacion: p.pieza.denominacion,
            cantidadSolicitada: p.cantidadSolicitada,
            stock: this.piezaStockInfo?.stock || 0,
            cantidadAFabricar: p.cantidadAFabricar,
            precio: this.piezaCotizacionInfo?.tieneCotizacion ? this.piezaCotizacionInfo.valor : p.cotizacionValor,
            fechaCotizacion: this.piezaCotizacionInfo?.tieneCotizacion ? this.piezaCotizacionInfo.fecha : (p.cotizacionFecha ? moment(p.cotizacionFecha).format('DD/MM/YYYY') : '')
        };

        const index = this.piezasAgregadas.findIndex(x => x.idTemp === item.idTemp);
        if (index > -1) this.piezasAgregadas[index] = item;
        else this.piezasAgregadas.push(item);

        this.piezasAgregadas = [...this.piezasAgregadas];
        this.resetItemForm(continueAdding);
    }

    resetItemForm(show: boolean): void {
        this.piezaForm.reset({ soloDelCliente: true });
        this.isEditingItem = false;
        this.showItemForm = show;
        this.piezaStockInfo = null;
        this.piezaCotizacionInfo = null;
    }

    editItem(item: any): void {
        this.isEditingItem = true;
        this.showItemForm = true;
        this.piezaForm.patchValue({
            idTemp: item.idTemp,
            pieza: { id: item.idPieza, codigo: item.codigo, denominacion: item.denominacion },
            cantidadSolicitada: item.cantidadSolicitada,
            cantidadAFabricar: item.cantidadAFabricar
        });
        this.onPiezaSelected({ option: { value: { id: item.idPieza } } });
    }

    removePieza(index: number): void {
        this.piezasAgregadas.splice(index, 1);
        this.piezasAgregadas = [...this.piezasAgregadas];
    }

    onSaveAll(): void {
        if (this.piezasAgregadas.length === 0) {
            this._notification.showError("Debe agregar al menos un ítem.");
            return;
        }
        this._notification.showSuccess("Orden Guardada Correctamente");
        this._router.navigate(['/orden-fabricacion/list']);
    }

    private _filter(val: any, list: any[]): any[] {
        const str = typeof val === 'string' ? val.toLowerCase() : (val?.nombre || val?.denominacion || '').toLowerCase();
        return list.filter(item => (item.nombre || item.denominacion || '').toLowerCase().includes(str));
    }

    displayFn(item: any): string { return item ? (item.nombre || item.denominacion) : ''; }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    get precioTotalItem(): number {
        const cantidad = this.piezaForm.get('cantidadSolicitada').value || 0;
        const precio = this.precioUnitarioActual || 0;
        return cantidad * precio;
    }
}