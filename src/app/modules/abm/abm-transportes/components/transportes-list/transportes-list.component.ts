import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmTransportesService } from '../../abm-transportes.service';
import { ITransporte, IErrorResponse } from '../../models/transporte.interface';
import { TransporteModalComponent } from '../transporte-modal/transporte-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-transportes-list',
    templateUrl: './transportes-list.component.html',
})
export class TransportesListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<ITransporte>([]);
    displayedColumns: string[] = ['nombre', 'direccion', 'telefono', 'email', 'horarioAtencion', 'mediosEnvio', 'acciones'];
    private originalData: ITransporte[] = [];

    private subscriptions = new Subscription();

    constructor(
        private abmTransportesService: AbmTransportesService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadTransportes();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadTransportes(): void {
        this.isLoading = true;
        const sub = this.abmTransportesService.getTransportes().subscribe({
            next: (response) => {
                this.originalData = response.data?.page || [];
                this.dataSource.data = this.originalData;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar transportes:', err);
                this.notificationService.showError('No se pudieron cargar los transportes.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = filterValue;
    }

    openEditModal(transporte: ITransporte): void {
        const dialogRef = this.dialog.open(TransporteModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'edit', transporte }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadTransportes();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(transporte: ITransporte): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar el transporte <strong>"${transporte.nombre}"</strong>?`
        );

        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '450px',
            data: {
                title: 'Confirmar Eliminación',
                message: message,
                showConfirmButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.deleteTransporte(transporte.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteTransporte(id: number): void {
        const sub = this.abmTransportesService.deleteTransporte(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Transporte eliminado correctamente.');
                this.loadTransportes();
            },
            error: (err) => {
                if (err.status === 409) {
                    const errorData: IErrorResponse = err.error;
                    this.notificationService.showError(errorData.data || 'El elemento está en uso y no puede ser eliminado.');
                } else {
                    console.error('Error al eliminar:', err);
                    this.notificationService.showError('Ocurrió un error al intentar eliminar el elemento.');
                }
            }
        });
        this.subscriptions.add(sub);
    }
    formatMediosEnvio(medios: any): string {
        if (!medios) return '-';
        const arr = Array.isArray(medios) ? medios : String(medios).split(',');
        return arr.map(m => {
            const trimmed = m.trim();
            if (!trimmed) return '';
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        }).filter(m => m !== '').join(', ');
    }
}
