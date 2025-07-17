import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmAdhesivosService } from '../../abm-adhesivos.service';
import { IAdhesivo, IErrorResponse } from '../../models/adhesivo.interface';
import { AdhesivoModalComponent } from '../adhesivo-modal/adhesivo-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-adhesivos-list',
    templateUrl: './adhesivos-list.component.html',
})
export class AdhesivosListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IAdhesivo>([]);
    displayedColumns: string[] = ['nombre', 'acciones'];
    private originalData: IAdhesivo[] = [];

    private subscriptions = new Subscription();

    constructor(
        private abmAdhesivosService: AbmAdhesivosService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadAdhesivos();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadAdhesivos(): void {
        this.isLoading = true;
        const sub = this.abmAdhesivosService.getAdhesivos().subscribe({
            next: (response) => {
                this.originalData = response.data || [];
                this.dataSource.data = this.originalData;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar adhesivos:', err);
                this.notificationService.showError('No se pudieron cargar los adhesivos.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = filterValue;
    }

    openEditModal(adhesivo: IAdhesivo): void {
        const dialogRef = this.dialog.open(AdhesivoModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'edit', adhesivo }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadAdhesivos();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(adhesivo: IAdhesivo): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar el adhesivo <strong>"${adhesivo.nombre}"</strong>?`
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
                this.deleteAdhesivo(adhesivo.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteAdhesivo(id: number): void {
        const sub = this.abmAdhesivosService.deleteAdhesivo(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Adhesivo eliminado correctamente.');
                this.loadAdhesivos();
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
}