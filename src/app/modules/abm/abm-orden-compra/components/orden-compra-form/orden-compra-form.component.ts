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
import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { IOrdenCompraApiResponse, IOrdenCompraCreateDTO } from '../../models/orden-compra.interface';
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
    @ViewChild('piezaInput', { read: MatAutocompleteTrigger }) piezaAutocompleteTrigger: MatAutocompleteTrigger;

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
        private _cdr: ChangeDetectorRef,
        private _dialog: MatDialog
    ) {
        this.form = this._fb.group({
            cliente: [null, Validators.required],
            fecha: [new Date(), Validators.required],
            nroComprobante: ['', Validators.required]
        });

        this.piezaForm = this._fb.group({
            idTemp: [null],
            pieza: [null, Validators.required],
            soloDelCliente: [true],
            cantidadSolicitada: [null, [Validators.required, Validators.min(1)]],
            fechaEntrega: [null, Validators.required],
            cotizacionValor: [null],
            cotizacionFecha: [null],
            actualizarCotizacion: [false]
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
                const clienteId = this.form.get('cliente').value?.id;

                return this._service.getPiezasCombo(solo ? clienteId : null, term).pipe(
                    map(res => res.data || [])
                );
            })
        );

        this.piezaForm.get('actualizarCotizacion').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((isUpdating) => {
            if (isUpdating) {
                this.piezaForm.patchValue({
                    cotizacionValor: null,
                    cotizacionFecha: null
                });
            } else if (this.piezaCotizacionInfo) {
                this.piezaForm.patchValue({
                    cotizacionValor: this.piezaCotizacionInfo.valor,
                    cotizacionFecha: this.piezaCotizacionInfo.fecha
                });
            }
            this.updateCotizacionValidators();
        });
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
                cotizacionValor: this.piezaCotizacionInfo.valor,
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
        if (this.piezaForm.invalid) { this.piezaForm.markAllAsTouched(); return; }

        const p = this.piezaForm.getRawValue();
        const precio = p.cotizacionValor;
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
            if (batchIndex > -1) {
                grupo.batches[batchIndex] = batch;
            } else {
                grupo.batches.push(batch);
            }
            grupo.idCotizacion = idCotiz;
            grupo.precio = precio;
            grupo.fechaCotizacion = fechaCotiz;
            grupo.esActualizacion = p.actualizarCotizacion;
        } else {
            grupo = {
                idPieza: p.pieza.id,
                codigo: p.pieza.codigo,
                denominacion: p.pieza.denominacion,
                idCotizacion: idCotiz,
                precio: precio,
                fechaCotizacion: fechaCotiz,
                esActualizacion: p.actualizarCotizacion,
                batches: [batch]
            };
            this.piezasAgregadas.push(grupo);
        }

        this.piezasAgregadas = [...this.piezasAgregadas];
        this.resetItemForm(continueAdding, false);

        if (continueAdding) {
            this.piezaForm.patchValue({
                pieza: p.pieza,
                soloDelCliente: p.soloDelCliente
            });
            this.onPiezaSelected({ option: { value: p.pieza } });
        }
    }

    onSaveAll(): void {
        if (this.piezasAgregadas.length === 0) { this._notification.showError("Agregue ítems a la orden"); return; }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const header = this.form.getRawValue();

            const dto: IOrdenCompraCreateDTO = {
                idCliente: header.cliente.id,
                cliente: header.cliente.nombre,
                fecha: moment(header.fecha).format('DD/MM/YYYY'),
                comprobante: header.nroComprobante,
                archivo: { nombre: this.selectedFile.name, archivo: base64 },
                detalle: this.piezasAgregadas.map(g => ({
                    idPieza: g.idPieza,
                    pieza: g.denominacion,
                    idCotizacion: (!g.esActualizacion && g.idCotizacion) ? g.idCotizacion : null,
                    valorCotizacion: (!g.esActualizacion && g.idCotizacion) ? null : g.precio,
                    fechaCotizacion: (!g.esActualizacion && g.idCotizacion) ? null : g.fechaCotizacion,
                    entregasSolicitadas: g.batches.map(b => ({
                        cantidad: b.cantidadSolicitada,
                        fechaEntregaSolicitada: b.fechaEntrega
                    }))
                }))
            };

            this._service.createOrdenCompra(dto).subscribe(() => {
                this._notification.showSuccess("Orden Guardada Correctamente");
                this._router.navigate(['/orden-compra/list']);
            }, (error) => {
                console.error(error);
                this._notification.showError(error.error?.message || "Error al guardar");
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
            this._service.updateHeaderSubtitle(`${cli} | Comprobante: ${comp}`);
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
        const isUpdating = this.piezaForm.get('actualizarCotizacion').value;

        if (this.piezaCotizacionInfo && (!this.piezaCotizacionInfo.tieneCotizacion || isUpdating)) {
            val.setValidators([Validators.required, Validators.min(0.01)]);
            fec.setValidators([Validators.required]);
        } else {
            val.clearValidators(); fec.clearValidators();
        }
        val.updateValueAndValidity(); fec.updateValueAndValidity();
    }

    resetItemForm(show: boolean, openAutocomplete: boolean = true): void {
        this.piezaForm.reset({ soloDelCliente: true });
        this.isEditingItem = false;
        this.piezaCotizacionInfo = null;
        if (show && openAutocomplete) {
            setTimeout(() => {
                this.piezaAutocompleteTrigger?.openPanel();
            });
        }
    }

    clearPiezaSelection(): void {
        this.piezaForm.get('pieza').setValue('');
        this.piezaCotizacionInfo = null;
        setTimeout(() => {
            this.piezaAutocompleteTrigger?.openPanel();
        });
    }

    clearClientSelection(): void { this.form.get('cliente').setValue(''); }

    removePieza(indexGrupo: number): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Eliminar ítem',
                message: '¿Está seguro de que desea eliminar todos los registros de esta pieza?',
                showConfirmButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.piezasAgregadas.splice(indexGrupo, 1);
                this.piezasAgregadas = [...this.piezasAgregadas];
                this._notification.showSuccess("Pieza eliminada");
            }
        });
    }

    removeBatch(grupo: any, indexBatch: number): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Eliminar entrega',
                message: '¿Está seguro de que desea eliminar esta entrega específica?',
                showConfirmButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                grupo.batches.splice(indexBatch, 1);
                if (grupo.batches.length === 0) {
                    const idx = this.piezasAgregadas.indexOf(grupo);
                    this.piezasAgregadas.splice(idx, 1);
                }
                this.piezasAgregadas = [...this.piezasAgregadas];
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
        } else {
            this._notification.showError("Cantidad y Fecha de entrega son requeridas");
        }
    }

    selectPieceFromCard(grupo: any): void {
        this.showItemForm = true;
        this.piezaForm.reset({ soloDelCliente: true });
        this.piezaForm.patchValue({
            pieza: { id: grupo.idPieza, codigo: grupo.codigo, denominacion: grupo.denominacion },
            cantidadSolicitada: null,
            fechaEntrega: null
        });
        this.onPiezaSelected({ option: { value: { id: grupo.idPieza } } });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editQuotation(grupo: any): void {
        grupo.isEditingQuotation = true;
        grupo.tempPrecio = grupo.precio;
        grupo.tempFecha = grupo.fechaCotizacion ? moment(grupo.fechaCotizacion, 'DD/MM/YYYY') : null;
    }

    saveQuotation(grupo: any): void {
        grupo.precio = grupo.tempPrecio;
        grupo.fechaCotizacion = grupo.tempFecha ? moment(grupo.tempFecha).format('DD/MM/YYYY') : '';
        grupo.isEditingQuotation = false;
    }

    cancelQuotationEdit(grupo: any): void {
        grupo.isEditingQuotation = false;
    }
    formatCurrency(value: number): string {
        if (value === null || value === undefined) return '$ 0,00';
        return '$ ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    displayFn(i: any): string { return i ? (i.nombre || i.denominacion) : ''; }
    get precioUnitarioActual(): number { return this.piezaCotizacionInfo?.tieneCotizacion ? this.piezaCotizacionInfo.valor : (this.piezaForm.get('cotizacionValor').value || 0); }
    get precioTotalItem(): number { return (this.piezaForm.get('cantidadSolicitada').value || 0) * this.precioUnitarioActual; }
    ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }
}