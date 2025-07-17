import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmTratamientoService } from '../../abm-tratamiento.service';
import { ITratamiento, IErrorResponse } from '../../models/tratamiento.interface';
import { TratamientoModalComponent } from '../tratamiento-modal/tratamiento-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-tratamiento-list',
    templateUrl: './tratamiento-list.component.html',
})
export class TratamientoListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<ITratamiento>([]);
    displayedColumns: string[] = ['nombre', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmTratamientoService: AbmTratamientoService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadTratamientos();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadTratamientos(): void {
        this.isLoading = true;
        const sub = this.abmTratamientoService.getTratamientos().subscribe({
            next: (response) => {
                this.dataSource.data = response.data || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar tratamientos:', err);
                this.notificationService.showError('No se pudieron cargar los tratamientos.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = filterValue;
    }

    openEditModal(tratamiento: ITratamiento): void {
        const dialogRef = this.dialog.open(TratamientoModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'edit', tratamiento }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadTratamientos();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(tratamiento: ITratamiento): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar el tratamiento <strong>"${tratamiento.nombre}"</strong>?`
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
                this.deleteTratamiento(tratamiento.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteTratamiento(id: number): void {
        const sub = this.abmTratamientoService.deleteTratamiento(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Tratamiento eliminado correctamente.');
                this.loadTratamientos();
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