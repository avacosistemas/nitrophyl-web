import { Component, OnDestroy, OnInit, ViewEncapsulation, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { IOrdenCompraCreateDTO } from '../../models/orden-compra.interface';
import { OrdenCompraHeaderComponent } from './headers/orden-compra-header.component';
import { OrdenCompraDetailsComponent } from './details/orden-compra-details.component';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-orden-compra-form',
    templateUrl: './orden-compra-form.component.html',
    styleUrls: ['./orden-compra-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OrdenCompraFormComponent implements OnInit, OnDestroy {
    @ViewChild(OrdenCompraHeaderComponent) headerComp: OrdenCompraHeaderComponent;
    @ViewChild(OrdenCompraDetailsComponent) detailsComp: OrdenCompraDetailsComponent;

    mode: 'create' | 'view' | 'edit' = 'create';
    orderId: number | null = null;
    step: 'header' | 'items' = 'header';
    orderEstado: string | null = null;
    
    form: FormGroup;
    piezaForm: FormGroup;
    selectedFile: File | null = null;
    pdfPreviewUrl: SafeResourceUrl | null = null;
    isImagePreview: boolean = false;
    isInitialLoading: boolean = false;

    piezasAgregadas: any[] = [];
    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _fb: FormBuilder,
        private _service: AbmOrdenCompraService,
        private _sanitizer: DomSanitizer,
        private _notification: NotificationService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _cdr: ChangeDetectorRef,
        private _dialog: MatDialog
    ) {
        this.form = this._fb.group({
            cliente: [null, Validators.required],
            fecha: [new Date(), Validators.required],
            nroComprobante: ['', Validators.required],
            tipoDespacho: ['RETIRO_CLIENTE', Validators.required],
            idEmpresaTransporte: [null],
            idDomicilioEnvio: [null],
            mediosEnvio: [[]],
            observaciones: ['']
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
        this._service.actionTriggered$.pipe(takeUntil(this._unsubscribeAll)).subscribe(action => {
            if (action === 'confirmHeader') this.onConfirmHeader();
            if (action === 'editHeader') { this.step = 'header'; this.updateHeaderUI(); }
            if (action === 'toggleSplit') { this.detailsComp?.toggleSplit(); this.updateHeaderUI(); }
            if (action === 'saveAll') this.onSaveAll(false);
            if (action === 'saveAllAndGenerateOF') this.onSaveAll(true);
            if (action === 'goBack') this._router.navigate(['/orden-compra/list']);
        });

        this._activatedRoute.url.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            const isEdit = this._activatedRoute.snapshot.url.some(segment => segment.path === 'edit');
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
                this.orderEstado = data.estado;
                this.form.patchValue({
                    cliente: { id: data.idCliente, nombre: data.cliente },
                    fecha: moment(data.fecha, 'YYYY-MM-DD').toDate(),
                    nroComprobante: data.comprobante,
                    tipoDespacho: data.tipoDespacho || 'RETIRO_CLIENTE',
                    idEmpresaTransporte: data.idEmpresaTransporte,
                    idDomicilioEnvio: data.idDomicilioEnvio,
                    mediosEnvio: data.mediosEnvio || [],
                    observaciones: data.observaciones || ''
                });

                if (data.archivo?.archivo) {
                    const byteCharacters = atob(data.archivo.archivo);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
                    const byteArray = new Uint8Array(byteNumbers);
                    
                    let type = 'application/pdf';
                    this.isImagePreview = false;
                    const nombreArchivo = data.archivo.nombre?.toLowerCase() || '';
                    if (nombreArchivo.endsWith('.jpg') || nombreArchivo.endsWith('.jpeg')) { type = 'image/jpeg'; this.isImagePreview = true; }
                    else if (nombreArchivo.endsWith('.png')) { type = 'image/png'; this.isImagePreview = true; }
                    else if (nombreArchivo.endsWith('.webp')) { type = 'image/webp'; this.isImagePreview = true; }

                    const blob = new Blob([byteArray], { type: type });
                    this.pdfPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
                }

                this.piezasAgregadas = data.detalle.map(d => ({
                    id: d.id, idPieza: d.idPieza, idCotizacion: d.idCotizacion,
                    esActualizacion: false, denominacion: d.pieza, precio: d.valorCotizacion,
                    fechaCotizacion: d.fechaCotizacion ? moment(d.fechaCotizacion).format('DD/MM/YYYY') : '',
                    batches: d.entregasSolicitadas.map(e => ({
                        id: e.id, idTemp: e.id, cantidadSolicitada: e.cantidad,
                        fechaEntrega: moment(e.fechaEntregaSolicitada, 'YYYY-MM-DD').format('DD/MM/YYYY'), isEditing: false
                    }))
                }));

                if (this.mode === 'view') { this.form.disable(); this.piezaForm.disable(); }
                else { this.form.enable(); this.piezaForm.enable(); }

                this.step = 'header';
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

    onFileSelected(file: File): void {
        this.selectedFile = file;
        this.isImagePreview = file.type.startsWith('image/');
        this.pdfPreviewUrl = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
    }

    onPiecesChanged(pieces: any[]): void {
        this.piezasAgregadas = pieces;
    }

    onSaveAll(generarOF: boolean = false): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); this._notification.showError("Complete los campos obligatorios de la cabecera"); return; }
        if (this.piezasAgregadas.length === 0) { this._notification.showError("Agregue ítems a la orden"); return; }

        if (generarOF) {
            const dialogRef = this._dialog.open(GenericModalComponent, {
                width: '450px',
                data: {
                    title: 'Confirmar Generación de OF',
                    message: 'Se van a generar ordenes de fabricacion por cada una de las entregas solicitadas de las piezas. Luego de generar las ordenes de fabricación no será posible modificar la orden de compra. ¿Desea continuar?',
                    showConfirmButton: true,
                    confirmButtonText: 'Continuar',
                    cancelButtonText: 'Cancelar',
                    type: 'warning'
                }
            });

            dialogRef.afterClosed().subscribe(confirmed => {
                if (confirmed) {
                    this.executeSave(generarOF);
                }
            });
        } else {
            this.executeSave(generarOF);
        }
    }

    private executeSave(generarOF: boolean): void {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result ? (reader.result as string).split(',')[1] : null;
            this.saveData(base64, generarOF);
        };

        if (this.selectedFile) { reader.readAsDataURL(this.selectedFile); }
        else { this.saveData(null, generarOF); }
    }

    private saveData(base64: string | null, generarOF: boolean): void {
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
            observaciones: header.observaciones || '',
            generarOrdenFabrica: generarOF,
            archivo: base64 ? { nombre: this.selectedFile.name, archivo: base64 } : null,
            detalle: this.piezasAgregadas.map(g => ({
                id: g.id || null, idPieza: g.idPieza, pieza: g.denominacion,
                idCotizacion: (!g.esActualizacion && g.idCotizacion) ? g.idCotizacion : null,
                valorCotizacion: parseFloat(g.precio || 0), fechaCotizacion: g.fechaCotizacion,
                entregasSolicitadas: g.batches.map(b => ({
                    id: b.id || null, cantidad: b.cantidadSolicitada, fechaEntregaSolicitada: b.fechaEntrega
                }))
            }))
        };

        const request$ = this.mode === 'edit' ? this._service.updateOrdenCompra(this.orderId, dto) : this._service.createOrdenCompra(dto);
        request$.subscribe(() => {
            this._notification.showSuccess(this.mode === 'edit' ? "Orden Actualizada Correctamente" : "Orden Guardada Correctamente");
            this._router.navigate(['/orden-compra/list']);
        }, (error) => {
            this._notification.showError(error.error?.message || "Error al guardar");
        });
    }

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

        const showGenerateOF = this.mode === 'edit' || (this.mode === 'create' && this.step === 'items');
        console.log('[DEBUG] updateHeaderUI:', { mode: this.mode, step: this.step, orderEstado: this.orderEstado, showGenerateOF });

        if (this.step === 'header') {
            btns = [
                { type: 'stroked', label: isView ? 'Volver' : 'Cancelar', action: 'goBack', condition: true },
                { type: 'flat', label: isView ? 'Ver Ítems' : 'Piezas', action: 'confirmHeader', condition: true }
            ];
            if (isEdit) {
                btns.splice(1, 0, { type: 'flat', label: 'Guardar', action: 'saveAll', condition: true });
                if (showGenerateOF) {
                    btns.splice(2, 0, { type: 'flat', label: 'Guardar y Generar OF', action: 'saveAllAndGenerateOF', condition: true });
                }
            }
            this._service.updateHeaderSubtitle(isView ? `${cli} | Comprobante: ${comp}` : '');
        } else {
            const isColumn = this.detailsComp?.splitDirection === 'column';
            const splitIcon = isColumn ? 'heroicons_outline:view-list' : 'heroicons_outline:view-boards';
            btns = [
                { type: 'icon', icon: splitIcon, action: 'toggleSplit', condition: true, tooltip: isColumn ? 'Cambiar a Vista Horizontal' : 'Cambiar a Vista Vertical' },
                { type: 'stroked', label: isView ? 'Volver a la lista' : 'Volver', action: isView ? 'goBack' : 'editHeader', condition: true }
            ];
            if (isView) { btns.splice(2, 0, { type: 'flat', label: 'Volver a Cabecera', action: 'editHeader', condition: true }); }
            else { 
                btns.push({ type: 'flat', label: 'Guardar', action: 'saveAll', condition: true }); 
                if (showGenerateOF) {
                    btns.push({ type: 'flat', label: 'Guardar y Generar OF', action: 'saveAllAndGenerateOF', condition: true });
                }
            }
            this._service.updateHeaderSubtitle(`${cli} | Comprobante: ${comp}`);
        }

        this._service.updateHeaderTitle(title);
        this._service.updateHeaderBreadcrumbs([...baseBreadcrumbs, { title: breadcrumbTitle, route: [], condition: true }]);
        this._service.updateHeaderButtons(btns);
    }

    ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }
}