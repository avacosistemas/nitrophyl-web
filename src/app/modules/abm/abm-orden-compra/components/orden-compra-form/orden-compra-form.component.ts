import { Component, OnDestroy, OnInit, ViewEncapsulation, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, startWith, map, debounceTime, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { IOrdenCompraCreateDTO } from '../../models/orden-compra.interface';
import { AbmTransportesService } from 'app/modules/abm/abm-transportes/abm-transportes.service';
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

    mode: 'create' | 'view' | 'edit' = 'create';
    orderId: number | null = null;
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
    isImagePreview: boolean = false;
    isLoading: boolean = false;
    isInitialLoading: boolean = false;

    imageZoom: number = 1;
    imageRotation: number = 0;
    imagePanX: number = 0;
    imagePanY: number = 0;
    isDraggingImage: boolean = false;
    startDragX: number = 0;
    startDragY: number = 0;

    get imageZoomPercent(): string { return Math.round(this.imageZoom * 100) + '%'; }

    clientes: any[] = [];
    filteredClientes$: Observable<any[]>;
    filteredPiezas$: Observable<any[]>;

    piezasAgregadas: any[] = [];
    piezaCotizacionInfo: any = null;
    transportes: any[] = [];
    domicilios: any[] = [];
    mediosEnvioDisponibles: string[] = [];
    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _fb: FormBuilder,
        private _service: AbmOrdenCompraService,
        private _clientesService: ClientesService,
        private _sanitizer: DomSanitizer,
        private _notification: NotificationService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _cdr: ChangeDetectorRef,
        private _dialog: MatDialog,
        private _transportesService: AbmTransportesService
    ) {
        this.form = this._fb.group({
            cliente: [null, Validators.required],
            fecha: [new Date(), Validators.required],
            nroComprobante: ['', Validators.required],
            tipoDespacho: ['RETIRO_CLIENTE', Validators.required],
            idEmpresaTransporte: [null],
            idDomicilioEnvio: [null],
            mediosEnvio: [[]]
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
        const id = this._activatedRoute.snapshot.params['id'];
        if (id) {
            this.isInitialLoading = true;
        }

        this.loadClientes();
        this.loadTransportes();
        this.setupObservers();

        this._activatedRoute.url.pipe(takeUntil(this._unsubscribeAll)).subscribe(url => {
            const isEdit = url.some(segment => segment.path === 'edit');
            const id = this._activatedRoute.snapshot.params['id'];
            
            if (id) {
                this.mode = isEdit ? 'edit' : 'view';
                this.orderId = +id;
                this.loadOrderData();
            } else {
                this.mode = 'create';
                this.updateHeaderUI();
            }
        });
    }

    private loadOrderData(): void {
        this.isInitialLoading = true;
        this._service.getOrdenCompra(this.orderId).subscribe({
            next: (res) => {
                const data = res.data;
                this.form.patchValue({
                    cliente: { id: data.idCliente, nombre: data.cliente },
                    fecha: moment(data.fecha, 'YYYY-MM-DD').toDate(),
                    nroComprobante: data.comprobante,
                    tipoDespacho: data.tipoDespacho || 'RETIRO_CLIENTE',
                    idEmpresaTransporte: data.idEmpresaTransporte,
                    idDomicilioEnvio: data.idDomicilioEnvio,
                    mediosEnvio: data.mediosEnvio || []
                });

                if (data.archivo?.archivo) {
                    const byteCharacters = atob(data.archivo.archivo);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    
                    let type = 'application/pdf';
                    this.isImagePreview = false;
                    const nombreArchivo = data.archivo.nombre?.toLowerCase() || '';
                    if (nombreArchivo.endsWith('.jpg') || nombreArchivo.endsWith('.jpeg')) {
                        type = 'image/jpeg';
                        this.isImagePreview = true;
                    } else if (nombreArchivo.endsWith('.png')) {
                        type = 'image/png';
                        this.isImagePreview = true;
                    } else if (nombreArchivo.endsWith('.webp')) {
                        type = 'image/webp';
                        this.isImagePreview = true;
                    }

                    const blob = new Blob([byteArray], { type: type });
                    this.pdfPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
                }

                this.piezasAgregadas = data.detalle.map(d => ({
                    id: d.id,
                    idPieza: d.idPieza,
                    denominacion: d.pieza,
                    precio: d.valorCotizacion,
                    fechaCotizacion: d.fechaCotizacion ? moment(d.fechaCotizacion).format('DD/MM/YYYY') : '',
                    batches: d.entregasSolicitadas.map(e => ({
                        id: e.id,
                        idTemp: e.id,
                        cantidadSolicitada: e.cantidad,
                        fechaEntrega: moment(e.fechaEntregaSolicitada, 'YYYY-MM-DD').format('DD/MM/YYYY'),
                        isEditing: false
                    }))
                }));

                if (this.mode === 'view') {
                    this.form.disable();
                    this.piezaForm.disable();
                } else {
                    this.form.enable();
                    this.piezaForm.enable();
                }
                this.step = 'header';
                this.showItemForm = false;
                this.isInitialLoading = false;
                this.updateHeaderUI();
                this._cdr.detectChanges();
            },
            error: () => {
                this.isInitialLoading = false;
                this._notification.showError('Error al cargar los datos de la orden.');
                this._router.navigate(['/orden-compra/list']);
            }
        });
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
        
        this.form.get('cliente').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(cliente => {
            if (cliente?.id) {
                this.loadDomicilios(cliente.id);
            } else {
                this.domicilios = [];
                this.form.patchValue({ idDomicilioEnvio: null });
            }
        });

        this.form.get('tipoDespacho').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(tipo => {
            this.form.patchValue({
                idEmpresaTransporte: null,
                idDomicilioEnvio: null,
                mediosEnvio: []
            }, { emitEvent: false });

            this.form.get('idEmpresaTransporte').clearValidators();
            this.form.get('idDomicilioEnvio').clearValidators();
            
            if (tipo === 'RETIRO_TRANSPORTE') {
                this.form.get('idEmpresaTransporte').setValidators([Validators.required]);
            } else if (tipo === 'ENVIA_NITRO') {
                this.form.get('idEmpresaTransporte').setValidators([Validators.required]);
                this.form.get('idDomicilioEnvio').setValidators([Validators.required]);
            }
            
            this.form.get('idEmpresaTransporte').updateValueAndValidity();
            this.form.get('idDomicilioEnvio').updateValueAndValidity();
        });

        this.form.get('idEmpresaTransporte').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(id => {
            const transporte = this.transportes.find(t => t.id === id);
            this.mediosEnvioDisponibles = transporte?.mediosEnvio || [];
            this.form.patchValue({ mediosEnvio: [] });
        });

        this.piezaForm.get('actualizarCotizacion').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((isUpdating) => {
            if (isUpdating) {
                this.piezaForm.patchValue({
                    cotizacionValor: null,
                    cotizacionFecha: null
                });
            } else if (this.piezaCotizacionInfo) {
                this.piezaForm.patchValue({
                    cotizacionValor: this.piezaCotizacionInfo.valor ? this.piezaCotizacionInfo.valor.toFixed(3) : null,
                    cotizacionFecha: this.piezaCotizacionInfo.fecha
                });
            }
            this.updateCotizacionValidators();
        });
    }

    onConfirmHeader(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        if (!this.selectedFile && this.mode === 'create') { this._notification.showError("Debe subir un archivo (PDF o Imagen)"); return; }

        if (this.selectedFile) {
            this.pdfPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.selectedFile));
            this.isImagePreview = this.selectedFile.type.startsWith('image/');
        }
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
        if (this.piezaForm.invalid) { this.piezaForm.markAllAsTouched(); return; }

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
            const base64 = reader.result ? (reader.result as string).split(',')[1] : null;
            this.saveData(base64);
        };

        if (this.selectedFile) {
            reader.readAsDataURL(this.selectedFile);
        } else {
            this.saveData(null);
        }
    }

    private saveData(base64: string | null): void {
        const header = this.form.getRawValue();

        const dto: IOrdenCompraCreateDTO = {
            id: this.mode === 'edit' ? this.orderId : null,
            idCliente: header.cliente.id,
            cliente: header.cliente.nombre,
            fecha: moment(header.fecha).format('DD/MM/YYYY'),
            comprobante: header.nroComprobante,
            tipoDespacho: header.tipoDespacho,
            idEmpresaTransporte: header.idEmpresaTransporte,
            idDomicilioEnvio: header.idDomicilioEnvio,
            mediosEnvio: header.mediosEnvio,
            archivo: base64 ? { nombre: this.selectedFile.name, archivo: base64 } : null,
            detalle: this.piezasAgregadas.map(g => ({
                id: g.id || null,
                idPieza: g.idPieza,
                pieza: g.denominacion,
                idCotizacion: (!g.esActualizacion && g.idCotizacion) ? g.idCotizacion : null,
                valorCotizacion: parseFloat(g.precio || 0),
                fechaCotizacion: g.fechaCotizacion,
                entregasSolicitadas: g.batches.map(b => ({
                    id: b.id || null,
                    cantidad: b.cantidadSolicitada,
                    fechaEntregaSolicitada: b.fechaEntrega
                }))
            }))
        };

        const request$ = this.mode === 'edit' 
            ? this._service.updateOrdenCompra(this.orderId, dto)
            : this._service.createOrdenCompra(dto);

        request$.subscribe(() => {
            this._notification.showSuccess(this.mode === 'edit' ? "Orden Actualizada Correctamente" : "Orden Guardada Correctamente");
            this._router.navigate(['/orden-compra/list']);
        }, (error) => {
            console.error(error);
            this._notification.showError(error.error?.message || "Error al guardar");
        });
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
    resetImageView(): void {
        this.imageZoom = 1;
        this.imageRotation = 0;
        this.imagePanX = 0;
        this.imagePanY = 0;
    }
    toggleSplit(): void { this.splitDirection = this.splitDirection === 'row' ? 'column' : 'row'; this.splitSize = 50; }

    updateHeaderUI(): void {
        const baseBreadcrumbs = [
            { title: 'Administración', route: [], condition: true },
            { title: 'Órdenes de Compra', route: ['/orden-compra'], condition: true }
        ];

        const isView = this.mode === 'view';
        const isEdit = this.mode === 'edit';
        const title = isView ? 'Ver Orden' : (isEdit ? 'Editar Orden' : 'Generar Orden');
        const cli = this.form.get('cliente').value?.nombre || '';
        const comp = this.form.get('nroComprobante').value;
        const breadcrumbTitle = isView ? 'Ver' : (isEdit ? 'Editar' : 'Nueva');

        let btns = [];
        if (this.step === 'header') {
            btns = [
                { type: 'stroked', label: isView ? 'Volver a la lista' : 'Cancelar', action: 'goBack', condition: true },
                { type: 'flat', label: isView ? 'Ver Ítems' : 'Confirmar y Continuar', action: 'confirmHeader', condition: true }
            ];
            this._service.updateHeaderSubtitle(isView ? `${cli} | Comprobante: ${comp}` : '');
        } else {
            btns = [
                { type: 'stroked', label: isView ? 'Volver a la lista' : 'Volver Atrás', action: isView ? 'goBack' : 'editHeader', condition: true },
                { type: 'stroked', label: 'Invertir Vista', action: 'toggleSplit', condition: true }
            ];
            
            if (isView) {
                btns.splice(1, 0, { type: 'stroked', label: 'Volver a Cabecera', action: 'editHeader', condition: true });
            } else {
                btns.push({ type: 'flat', label: isEdit ? 'Actualizar Orden' : 'Finalizar Orden', action: 'saveAll', condition: true });
            }
            this._service.updateHeaderSubtitle(`${cli} | Comprobante: ${comp}`);
        }

        this._service.updateHeaderTitle(title);
        this._service.updateHeaderBreadcrumbs([...baseBreadcrumbs, { title: breadcrumbTitle, route: [], condition: true }]);
        this._service.updateHeaderButtons(btns);
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                this.selectedFile = file;
                this.isImagePreview = file.type.startsWith('image/');
            } else {
                this._notification.showError("Solo PDF o Imágenes");
            }
        }
    }

    loadClientes(): void {
        this._clientesService.getClientes().subscribe(res => this.clientes = res.data || []);
    }

    loadTransportes(): void {
        this._transportesService.getTransportes({ rows: 100 }).subscribe(res => {
            this.transportes = res.data?.page || [];
        });
    }

    loadDomicilios(idCliente: number): void {
        this._clientesService.getDomicilios(idCliente).subscribe(res => {
            this.domicilios = (res.data || []).filter(d => d.tipo === 'EXPEDICION');
        });
    }

    onMedioEnvioToggle(medio: string, checked: boolean): void {
        const current = this.form.get('mediosEnvio').value as string[];
        if (checked) {
            this.form.get('mediosEnvio').setValue([...current, medio]);
        } else {
            this.form.get('mediosEnvio').setValue(current.filter(m => m !== medio));
        }
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
        grupo.tempPrecio = grupo.precio ? grupo.precio.toFixed(3) : '0.000';
        grupo.tempFecha = grupo.fechaCotizacion ? moment(grupo.fechaCotizacion, 'DD/MM/YYYY') : null;
    }

    saveQuotation(grupo: any): void {
        grupo.precio = parseFloat(grupo.tempPrecio || 0);
        grupo.fechaCotizacion = grupo.tempFecha ? moment(grupo.tempFecha).format('DD/MM/YYYY') : '';
        grupo.isEditingQuotation = false;
    }

    cancelQuotationEdit(grupo: any): void {
        grupo.isEditingQuotation = false;
    }
    formatCurrency(value: number): string {
        if (value === null || value === undefined) return 'U$D 0.000';
        return 'U$D ' + value.toFixed(3);
    }

    displayFn(i: any): string { return i ? (i.nombre || i.denominacion) : ''; }
    get precioUnitarioActual(): number { 
        const val = this.piezaForm.get('cotizacionValor').value;
        return this.piezaCotizacionInfo?.tieneCotizacion && !this.piezaForm.get('actualizarCotizacion').value ? 
            this.piezaCotizacionInfo.valor : 
            parseFloat(val || 0); 
    }
    get precioTotalItem(): number { return (this.piezaForm.get('cantidadSolicitada').value || 0) * this.precioUnitarioActual; }

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
    ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }
}