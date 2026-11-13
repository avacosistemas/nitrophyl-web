import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';
import { OrdenCompraCancelTotalModalComponent } from '../orden-compra-list/modals/orden-compra-cancel-total-modal/orden-compra-cancel-total-modal.component';
import { AsignarStockModalComponent } from './modals/asignar-stock-modal/asignar-stock-modal.component';
import { CambiarCantidadesModalComponent } from './modals/cambiar-cantidades-modal/cambiar-cantidades-modal.component';

export type GestionMode = 'cancelar-items' | 'asignar-stock' | 'cambiar-cantidades';

@Component({
    selector: 'app-orden-compra-gestion-items',
    templateUrl: './orden-compra-gestion-items.component.html'
})
export class OrdenCompraGestionItemsComponent implements OnInit, OnDestroy {
    mode: GestionMode = 'cancelar-items';
    orderId!: number;
    isLoading: boolean = true;
    ordenData: any = null;
    piezasAgregadas: any[] = [];

    private _destroy$ = new Subject<void>();

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _service: AbmOrdenCompraService,
        private _dialog: MatDialog,
        private _notification: NotificationService,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this._route.params.pipe(takeUntil(this._destroy$)).subscribe(params => {
            this.orderId = +params['id'];
            const urlPath = this._route.snapshot.url[0]?.path;
            if (urlPath === 'asignar-stock') {
                this.mode = 'asignar-stock';
            } else if (urlPath === 'cambiar-cantidades') {
                this.mode = 'cambiar-cantidades';
            } else {
                this.mode = 'cancelar-items';
            }
            this.updateHeaderConfig();
            this.loadOrderData();
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    private updateHeaderConfig(): void {
        const title = this.getModeTitle();
        this._service.updateHeaderTitle(title);
        this._service.updateHeaderSubtitle('');
        this._service.updateHeaderBreadcrumbs([
            { title: 'Administración', route: [], condition: true },
            { title: 'Órdenes de Compra', route: ['/orden-compra'], condition: true },
            { title: title, route: [], condition: true }
        ]);
        this._service.updateHeaderButtons([
            { type: 'stroked', label: 'Cancelar', action: 'goBack', condition: true }
        ]);

        this._service.actionTriggered$.pipe(takeUntil(this._destroy$)).subscribe(action => {
            if (action === 'goBack') {
                this.goBack();
            }
        });
    }

    getModeTitle(): string {
        switch (this.mode) {
            case 'asignar-stock':
                return 'Asignar Stock';
            case 'cambiar-cantidades':
                return 'Cambiar Cantidades';
            case 'cancelar-items':
            default:
                return 'Cancelar Ítems';
        }
    }

    getModeBadgeClass(): string {
        switch (this.mode) {
            case 'asignar-stock':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'cambiar-cantidades':
                return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'cancelar-items':
            default:
                return 'bg-red-100 text-red-800 border border-red-200';
        }
    }

    loadOrderData(): void {
        this.isLoading = true;
        this._service.getOrdenCompra(this.orderId).subscribe({
            next: (res) => {
                this.isLoading = false;
                const data = res.data;
                this.ordenData = data;
                this._service.updateHeaderSubtitle(`${data.cliente || ''} | Comprobante: ${data.comprobante || ''}`);

                this.piezasAgregadas = (data.detalle || []).map((d: any) => ({
                    id: d.id,
                    idPieza: d.idPieza,
                    idCotizacion: d.idCotizacion,
                    denominacion: d.pieza,
                    precio: d.valorCotizacion,
                    fechaCotizacion: d.fechaCotizacion ? moment(d.fechaCotizacion).format('DD/MM/YYYY') : '',
                    descuento: d.descuento,
                    observacion: d.observacion,
                    batches: (d.entregasSolicitadas || []).map((e: any) => ({
                        id: e.id,
                        cantidadSolicitada: e.cantidad,
                        fechaEntrega: moment(e.fechaEntregaSolicitada, 'YYYY-MM-DD').format('DD/MM/YYYY')
                    }))
                }));
                this._cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this._notification.showError('Error al cargar la orden de compra');
                this.goBack();
            }
        });
    }

    goBack(): void {
        this._router.navigate(['/orden-compra/list']);
    }

    formatCurrency(value: number): string {
        if (value === null || value === undefined) return 'U$D 0.000';
        return 'U$D ' + value.toFixed(3);
    }

    getTotalQuantity(grupo: any): number {
        return (grupo.batches || []).reduce((acc: number, b: any) => acc + (b.cantidadSolicitada || 0), 0);
    }

    cancelarEntrega(grupo: any, batchIndex: number): void {
        const batch = grupo.batches[batchIndex];
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '460px',
            autoFocus: false,
            data: {
                title: 'Cancelar Entrega',
                message: `¿Está seguro de que desea cancelar la entrega de <strong>${batch.cantidadSolicitada} unidades</strong> con fecha <strong>${batch.fechaEntrega}</strong> para la pieza <strong>${grupo.denominacion}</strong>? Esta acción es destructiva.`,
                icon: 'x-circle',
                type: 'warning',
                showConfirmButton: true,
                confirmButtonText: 'Confirmar Cancelación',
                showCloseButton: true,
                cancelButtonText: 'Volver',
                customComponent: OrdenCompraCancelTotalModalComponent,
                componentData: {
                    comprobante: `${this.ordenData?.comprobante} - Entrega ${batch.fechaEntrega}`,
                    id: batch.id
                }
            }
        });

        dialogRef.afterClosed().subscribe(motivo => {
            if (motivo) {
                if (batch.id) {
                    this._service.deleteOrdenCompraDetallePedido(batch.id).subscribe({
                        next: () => {
                            this._notification.showSuccess('Entrega cancelada correctamente');
                            this.aplicarBajaEntregaLocal(grupo, batchIndex);
                        },
                        error: (err) => {
                            this._notification.showError(err.error?.message || 'Error al cancelar la entrega');
                        }
                    });
                } else {
                    this._notification.showSuccess('Entrega cancelada correctamente');
                    this.aplicarBajaEntregaLocal(grupo, batchIndex);
                }
            }
        });
    }

    private aplicarBajaEntregaLocal(grupo: any, batchIndex: number): void {
        grupo.batches.splice(batchIndex, 1);
        if (grupo.batches.length === 0) {
            const idx = this.piezasAgregadas.indexOf(grupo);
            if (idx > -1) {
                this.piezasAgregadas.splice(idx, 1);
            }
        }
        this._cdr.detectChanges();
    }

    cancelarPiezaCompleta(grupo: any, index: number): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '460px',
            autoFocus: false,
            data: {
                title: 'Cancelar Ítem Completo',
                message: `¿Está seguro de que desea cancelar el ítem completo <strong>${grupo.denominacion}</strong> y todas sus entregas asociadas? Esta acción es destructiva.`,
                icon: 'x-circle',
                type: 'warning',
                showConfirmButton: true,
                confirmButtonText: 'Confirmar Cancelación',
                showCloseButton: true,
                cancelButtonText: 'Volver',
                customComponent: OrdenCompraCancelTotalModalComponent,
                componentData: {
                    comprobante: `${this.ordenData?.comprobante} - Ítem ${grupo.denominacion}`,
                    id: grupo.id
                }
            }
        });

        dialogRef.afterClosed().subscribe(motivo => {
            if (motivo) {
                if (grupo.id) {
                    this._service.deleteOrdenCompraDetalle(grupo.id).subscribe({
                        next: () => {
                            this._notification.showSuccess('Ítem cancelado correctamente');
                            this.piezasAgregadas.splice(index, 1);
                            this._cdr.detectChanges();
                        },
                        error: (err) => {
                            this._notification.showError(err.error?.message || 'Error al cancelar el ítem');
                        }
                    });
                } else {
                    this._notification.showSuccess('Ítem cancelado correctamente');
                    this.piezasAgregadas.splice(index, 1);
                    this._cdr.detectChanges();
                }
            }
        });
    }

    asignarStockItem(grupo: any): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '580px',
            maxHeight: '90vh',
            autoFocus: false,
            data: {
                title: 'Asignar Stock a Ítem',
                icon: 'cube',
                type: 'primary',
                showConfirmButton: true,
                confirmButtonText: 'Asignar',
                showCloseButton: true,
                cancelButtonText: 'Cancelar',
                customComponent: AsignarStockModalComponent,
                componentData: { item: grupo }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._notification.showSuccess(`Stock asignado con éxito (${result.totalAsignado} unidades distribuidas)`);
                this._cdr.detectChanges();
            }
        });
    }

    cambiarCantidadEntrega(grupo: any, batch: any): void {
        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '480px',
            autoFocus: false,
            data: {
                title: 'Cambiar Cantidad',
                icon: 'adjustments',
                type: 'primary',
                showConfirmButton: true,
                confirmButtonText: 'Guardar Cambios',
                showCloseButton: true,
                cancelButtonText: 'Cancelar',
                customComponent: CambiarCantidadesModalComponent,
                componentData: { grupo, batch }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const prevCantidad = batch.cantidadSolicitada;
                batch.cantidadSolicitada = result.nuevaCantidad;

                if (batch.id) {
                    const payload = {
                        id: batch.id,
                        cantidad: result.nuevaCantidad,
                        fechaEntregaSolicitada: moment(batch.fechaEntrega, 'DD/MM/YYYY').format('YYYY-MM-DD'),
                        motivo: result.motivo
                    };
                    this._service.updateOrdenCompraDetallePedido(batch.id, payload).subscribe({
                        next: () => {
                            this._notification.showSuccess('Cantidad actualizada correctamente');
                            this._cdr.detectChanges();
                        },
                        error: (err) => {
                            batch.cantidadSolicitada = prevCantidad;
                            this._notification.showError(err.error?.message || 'Error al actualizar la cantidad');
                            this._cdr.detectChanges();
                        }
                    });
                } else {
                    this._notification.showSuccess('Cantidad actualizada correctamente');
                    this._cdr.detectChanges();
                }
            }
        });
    }
}
