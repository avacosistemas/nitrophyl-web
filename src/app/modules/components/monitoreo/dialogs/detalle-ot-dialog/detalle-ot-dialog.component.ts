import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop, CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { NotificationService } from 'app/shared/services/notification.service';
import { MonitoreoService, OrdenTrabajoDetalle, MaquinaMonitoreo } from '../../monitoreo.service';
import { generarHtmlPlanillaMaquina } from '../../utils/monitoreo-html.generator';

@Component({
    selector: 'app-detalle-ot-dialog',
    templateUrl: './detalle-ot-dialog.component.html',
    styleUrls: ['./detalle-ot-dialog.component.scss']
})
export class DetalleOtDialogComponent implements OnInit {
    isLoading = true;
    errorLoading = false;
    maquina: MaquinaMonitoreo;
    ots: OrdenTrabajoDetalle[] = [];

    displayedColumns: string[] = ['drag', 'of', 'cliente', 'pieza', 'material', 'cantidad', 'fechaEntrega'];

    constructor(
        public dialogRef: MatDialogRef<DetalleOtDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { maquina: MaquinaMonitoreo },
        private monitoreoService: MonitoreoService,
        private notificationService: NotificationService
    ) {
        this.maquina = data.maquina;
    }

    ngOnInit(): void {
        this.loadOts();
    }

    loadOts(): void {
        this.isLoading = true;
        this.errorLoading = false;

        const idMaquina = this.maquina.idMaquina ?? this.maquina.id;

        this.monitoreoService.getOtsPorMaquina(idMaquina, this.maquina.idSector).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res && res.status === 'OK' && Array.isArray(res.data)) {
                    this.ots = res.data.map((item: OrdenTrabajoDetalle, idx: number) => ({
                        ...item,
                        posicion: item.posicion || idx + 1
                    })).sort((a: OrdenTrabajoDetalle, b: OrdenTrabajoDetalle) => a.posicion - b.posicion);
                } else {
                    this.ots = [];
                }
            },
            error: () => {
                this.isLoading = false;
                this.errorLoading = true;
            }
        });
    }

    formatMaterial(material: string): string {
        if (!material) return '';
        return material.replace(/Fórmula\s*/gi, '').trim();
    }

    onSorted(event: CdkDragSortEvent<OrdenTrabajoDetalle[]>): void {
        if (event.previousIndex !== event.currentIndex) {
            moveItemInArray(this.ots, event.previousIndex, event.currentIndex);
            this.ots.forEach((ot, idx) => {
                ot.posicion = idx + 1;
            });
            this.ots = [...this.ots];
        }
    }

    drop(event: CdkDragDrop<OrdenTrabajoDetalle[]>): void {
        const prevIndex = event.previousIndex;
        const newIndex = event.currentIndex;

        if (prevIndex !== newIndex) {
            moveItemInArray(this.ots, prevIndex, newIndex);
        }

        this.ots.forEach((ot, idx) => {
            ot.posicion = idx + 1;
        });

        this.ots = [...this.ots];

        const movedOt = this.ots[newIndex];
        const nuevaPosicion = newIndex + 1;

        this.monitoreoService.actualizarPosicionOt(movedOt.id, nuevaPosicion).subscribe({
            next: () => {
                this.notificationService.showSuccess(`OT ${movedOt.of} movida a la posición ${nuevaPosicion}`, 3000);
            },
            error: (err) => {
                console.error('Error al actualizar posición:', err);
                this.notificationService.showError(`Error al guardar la nueva posición de ${movedOt.of}`, 4000);
            }
        });
    }

    imprimirPlanilla(): void {
        const html = generarHtmlPlanillaMaquina(this.maquina, this.ots);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();

            setTimeout(() => {
                if (iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                }
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 300);
        }
    }

    close(): void {
        this.dialogRef.close(this.ots);
    }
}
