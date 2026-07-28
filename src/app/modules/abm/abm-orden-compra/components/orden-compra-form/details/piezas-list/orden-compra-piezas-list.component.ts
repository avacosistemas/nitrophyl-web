import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';
import { OrdenCompraPiezaEditModalComponent } from './edit-modal/orden-compra-pieza-edit-modal.component';
import moment from 'moment';

@Component({
    selector: 'app-orden-compra-piezas-list',
    templateUrl: './orden-compra-piezas-list.component.html',
    styleUrls: ['./orden-compra-piezas-list.component.scss']
})
export class OrdenCompraPiezasListComponent {
    @Input() piezasAgregadas: any[] = [];
    @Input() mode: 'create' | 'view' | 'edit' = 'create';

    @Output() piecesChanged = new EventEmitter<any[]>();
    @Output() selectPiece = new EventEmitter<any>();

    minDate: Date = new Date();

    dateFilter = (d: any | null): boolean => {
        if (!d) return true;
        const day = moment(d).day();
        return day !== 0 && day !== 6;
    };

    constructor(
        private _dialog: MatDialog,
        private _notification: NotificationService,
        private _cdr: ChangeDetectorRef
    ) { }

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
                this._cdr.detectChanges();
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
                this._cdr.detectChanges();
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
            this._cdr.detectChanges();
        } else {
            this._notification.showError("Cantidad y Fecha de entrega son requeridas");
        }
    }

    selectPieceFromCard(grupo: any): void {
        this.selectPiece.emit(grupo);
    }

    editQuotation(grupo: any): void {
        const dialogRef = this._dialog.open(OrdenCompraPiezaEditModalComponent, {
            panelClass: 'dialog-edit-item-oc',
            width: '600px',
            data: {
                denominacion: grupo.denominacion,
                precio: grupo.precio,
                fechaCotizacion: grupo.fechaCotizacion,
                descuento: grupo.descuento,
                observacion: grupo.observacion
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                grupo.precio = result.precio;
                grupo.fechaCotizacion = result.fechaCotizacion ? result.fechaCotizacion.format('DD/MM/YYYY') : '';
                grupo.descuento = result.descuento;
                grupo.observacion = result.observacion;
                grupo.esActualizacion = true;
                grupo.idCotizacion = null;
                this.piecesChanged.emit([...this.piezasAgregadas]);
                this._cdr.detectChanges();
            }
        });
    }

    formatCurrency(value: number): string {
        if (value === null || value === undefined) return 'U$D 0.000';
        return 'U$D ' + value.toFixed(3);
    }

    getTotalQuantity(grupo: any): number {
        return (grupo.batches || []).reduce((acc: number, b: any) => acc + (b.cantidadSolicitada || 0), 0);
    }

    getSubtotalGrupo(grupo: any): number {
        return this.getTotalQuantity(grupo) * (grupo.precio || 0);
    }

    getDescuentoGrupo(grupo: any): number {
        if (!grupo.descuento) return 0;
        return this.getSubtotalGrupo(grupo) * (grupo.descuento / 100);
    }

    getTotalGrupo(grupo: any): number {
        return this.getSubtotalGrupo(grupo) - this.getDescuentoGrupo(grupo);
    }
}
