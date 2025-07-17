import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmPrensaService } from '../../abm-prensa.service';
import { IPrensa, IErrorResponse } from '../../models/prensa.interface';
import { PrensaModalComponent } from '../prensa-modal/prensa-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-prensa-list',
    templateUrl: './prensa-list.component.html',
})
export class PrensaListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IPrensa>([]);
    displayedColumns: string[] = ['nombre', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmPrensaService: AbmPrensaService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadPrensas();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadPrensas(): void {
        this.isLoading = true;
        const sub = this.abmPrensaService.getPrensas().subscribe({
            next: (response) => {
                this.dataSource.data = response.data || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar prensas:', err);
                this.notificationService.showError('No se pudieron cargar las prensas.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = filterValue;
    }

    openEditModal(prensa: IPrensa): void {
        const dialogRef = this.dialog.open(PrensaModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'edit', prensa }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadPrensas();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(prensa: IPrensa): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar la prensa <strong>"${prensa.nombre}"</strong>?`
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
                this.deletePrensa(prensa.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deletePrensa(id: number): void {
        const sub = this.abmPrensaService.deletePrensa(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Prensa eliminada correctamente.');
                this.loadPrensas();
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