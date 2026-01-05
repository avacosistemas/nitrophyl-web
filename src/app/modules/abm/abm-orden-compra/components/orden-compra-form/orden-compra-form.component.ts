import { Component, OnDestroy, OnInit, ViewEncapsulation, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, startWith, map, debounceTime, switchMap } from 'rxjs/operators';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import * as moment from 'moment';

@Component({
    selector: 'app-orden-compra-form',
    templateUrl: './orden-compra-form.component.html',
    styleUrls: ['./orden-compra-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OrdenCompraFormComponent implements OnInit, OnDestroy {
    @ViewChild('splitContainer') splitContainer: ElementRef;
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) clienteAutocompleteTrigger: MatAutocompleteTrigger;

    step: 'header' | 'items' = 'header';
    splitDirection: 'row' | 'column' = 'row';
    showItemForm: boolean = true;
    isEditingItem: boolean = false;
    isResizing: boolean = false;
    splitSize: number = 50;

    form: FormGroup;
    piezaForm: FormGroup;
    selectedFile: File | null = null;
    pdfPreviewUrl: SafeResourceUrl | null = null;
    isLoading: boolean = false;

    clientes: any[] = [];
    filteredClientes$: Observable<any[]>;
    filteredPiezas$: Observable<any[]>;

    piezasAgregadas: any[] = [];
    piezaCotizacionInfo: any = null;
    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _fb: FormBuilder,
        private _service: AbmOrdenCompraService,
        private _clientesService: ClientesService,
        private _sanitizer: DomSanitizer,
        private _notification: NotificationService,
        private _router: Router,
        private _cdr: ChangeDetectorRef
    ) {
        this.form = this._fb.group({
            cliente: [null, Validators.required],
            fecha: [new Date(), Validators.required],
            nroComprobante: ['', Validators.required],
            nroInterno: ['', Validators.required]
        });

        this.piezaForm = this._fb.group({
            idTemp: [null],
            pieza: [null, Validators.required],
            soloDelCliente: [true],
            cantidadSolicitada: [null, [Validators.required, Validators.min(1)]],
            cotizacionValor: [null],
            cotizacionFecha: [null]
        });
    }

    ngOnInit(): void {
        this.loadClientes();
        this.setupObservers();
        this.updateHeaderUI();
    }

    private setupObservers(): void {
        this._service.actionTriggered$.pipe(takeUntil(this._unsubscribeAll)).subscribe(action => {
            if (action === 'confirmHeader') this.onConfirmHeader();
            if (action === 'editHeader') { this.step = 'header'; this.updateHeaderUI(); }
            if (action === 'toggleSplit') this.toggleSplit();
            if (action === 'saveAll') this.onSaveAll();
            if (action === 'goBack') this._router.navigate(['/orden-compra/list']);
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
            switchMap(([val, solo]) => {
                const term = typeof val === 'string' ? val : '';
                return this._service.getPiezas(this.form.get('cliente').value?.id, solo).pipe(
                    map(res => this._filter(term, res.data || []))
                );
            })
        );
    }

    onConfirmHeader(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        if (!this.selectedFile) { this._notification.showError("Debe subir un archivo PDF"); return; }
        
        this.pdfPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.selectedFile));
        this.step = 'items';
        this.updateHeaderUI();
    }

    onPiezaSelected(event: any): void {
        const pieza = event.option.value;
        this.isLoading = true;
        this._service.getPiezaCotizacion(pieza.id, this.form.get('cliente').value?.id).subscribe(res => {
            this.piezaCotizacionInfo = res.data;
            this.updateCotizacionValidators();
            this.isLoading = false;
            this._cdr.detectChanges();
        });
    }

    addOrUpdatePieza(continueAdding: boolean): void {
        if (this.piezaForm.invalid) { this.piezaForm.markAllAsTouched(); return; }
        const p = this.piezaForm.getRawValue();
        const item = {
            idTemp: p.idTemp || Date.now(),
            idPieza: p.pieza.id,
            codigo: p.pieza.codigo,
            denominacion: p.pieza.denominacion,
            cantidadSolicitada: p.cantidadSolicitada,
            precio: this.piezaCotizacionInfo.tieneCotizacion ? this.piezaCotizacionInfo.valor : p.cotizacionValor,
            fechaCotizacion: this.piezaCotizacionInfo.tieneCotizacion ? this.piezaCotizacionInfo.fecha : (p.cotizacionFecha ? moment(p.cotizacionFecha).format('DD/MM/YYYY') : '')
        };

        const index = this.piezasAgregadas.findIndex(x => x.idTemp === item.idTemp);
        if (index > -1) this.piezasAgregadas[index] = item;
        else this.piezasAgregadas.push(item);

        this.piezasAgregadas = [...this.piezasAgregadas];
        this.resetItemForm(continueAdding);
    }

    onSaveAll(): void {
        if (this.piezasAgregadas.length === 0) { this._notification.showError("Agregue ítems a la orden"); return; }
        
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const header = this.form.getRawValue();
            const dto = {
                idCliente: header.cliente.id,
                fecha: moment(header.fecha).format('DD/MM/YYYY'),
                nroComprobante: header.nroComprobante,
                nroInterno: header.nroInterno,
                archivoNombre: this.selectedFile.name,
                archivoContenido: base64,
                items: this.piezasAgregadas.map(i => ({
                    idPieza: i.idPieza,
                    cantidad: i.cantidadSolicitada,
                    precio: i.precio,
                    fechaCotizacion: i.fechaCotizacion
                }))
            };
            this._service.createOrdenCompra(dto).subscribe(() => {
                this._notification.showSuccess("Orden Guardada Correctamente");
                this._router.navigate(['/orden-compra/list']);
            });
        };
        reader.readAsDataURL(this.selectedFile);
    }

    startResizing(event: MouseEvent): void { event.preventDefault(); this.isResizing = true; }
    @HostListener('window:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (!this.isResizing || !this.splitContainer) return;
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
    @HostListener('window:mouseup') onMouseUp(): void { this.isResizing = false; }
    toggleSplit(): void { this.splitDirection = this.splitDirection === 'row' ? 'column' : 'row'; this.splitSize = 50; }

    updateHeaderUI(): void {
        let btns = [];
        if (this.step === 'header') {
            btns = [
                { type: 'stroked', label: 'Cancelar', action: 'goBack', condition: true },
                { type: 'flat', label: 'Confirmar y Continuar', action: 'confirmHeader', condition: true }
            ];
            this._service.updateHeaderSubtitle('');
        } else {
            btns = [
                { type: 'stroked', label: 'Volver Atrás', action: 'editHeader', condition: true },
                { type: 'stroked', label: 'Invertir Vista', action: 'toggleSplit', condition: true },
                { type: 'flat', label: 'Finalizar Orden', action: 'saveAll', condition: true }
            ];
            const cli = this.form.get('cliente').value.nombre;
            const comp = this.form.get('nroComprobante').value;
            this._service.updateHeaderSubtitle(`${cli} | Comp: ${comp}`);
        }
        this._service.updateHeaderButtons(btns);
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file?.type === 'application/pdf') this.selectedFile = file;
        else this._notification.showError("Solo PDF");
    }

    loadClientes(): void {
        this._clientesService.getClientes().subscribe(res => this.clientes = res.data || []);
    }

    private _filter(val: any, list: any[]): any[] {
        const str = (typeof val === 'string' ? val : (val?.nombre || val?.denominacion || '')).toLowerCase();
        return list.filter(i => (i.nombre || i.denominacion || i.codigo || '').toLowerCase().includes(str));
    }

    updateCotizacionValidators(): void {
        const val = this.piezaForm.get('cotizacionValor');
        const fec = this.piezaForm.get('cotizacionFecha');
        if (this.piezaCotizacionInfo && !this.piezaCotizacionInfo.tieneCotizacion) {
            val.setValidators([Validators.required, Validators.min(0.01)]);
            fec.setValidators([Validators.required]);
        } else {
            val.clearValidators(); fec.clearValidators();
        }
        val.updateValueAndValidity(); fec.updateValueAndValidity();
    }

    resetItemForm(show: boolean): void {
        this.piezaForm.reset({ soloDelCliente: true });
        this.isEditingItem = false;
        this.showItemForm = show;
        this.piezaCotizacionInfo = null;
    }

    editItem(item: any): void {
        this.isEditingItem = true;
        this.showItemForm = true;
        this.piezaForm.patchValue({
            idTemp: item.idTemp,
            pieza: { id: item.idPieza, codigo: item.codigo, denominacion: item.denominacion },
            cantidadSolicitada: item.cantidadSolicitada
        });
        this.onPiezaSelected({ option: { value: { id: item.idPieza } } });
    }

    clearPiezaSelection(): void { this.piezaForm.get('pieza').setValue(''); this.piezaCotizacionInfo = null; }
    clearClientSelection(): void { this.form.get('cliente').setValue(''); }
    removePieza(i: number): void { this.piezasAgregadas.splice(i, 1); }
    displayFn(i: any): string { return i ? (i.nombre || i.denominacion) : ''; }
    get precioUnitarioActual(): number { return this.piezaCotizacionInfo?.tieneCotizacion ? this.piezaCotizacionInfo.valor : (this.piezaForm.get('cotizacionValor').value || 0); }
    get precioTotalItem(): number { return (this.piezaForm.get('cantidadSolicitada').value || 0) * this.precioUnitarioActual; }
    ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }
}