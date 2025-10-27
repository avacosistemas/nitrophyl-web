import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmMateriaPrimaService } from '../../abm-materiaprima.service';
import { IMateriaPrima, IErrorResponse } from '../../models/materia-prima.interface';
import { MateriaPrimaModalComponent } from '../materia-prima-modal/materia-prima-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-materia-prima-list',
    templateUrl: './materia-prima-list.component.html',
})
export class MateriaPrimaListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IMateriaPrima>([]);
    displayedColumns: string[] = ['nombre', 'cantidadStock', 'unidadMedidaStock', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmMateriaPrimaService: AbmMateriaPrimaService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {
        this.dataSource.filterPredicate = (data: IMateriaPrima, filter: string): boolean => {
            const dataStr = `${data.nombre} ${data.cantidadStock} ${data.unidadMedidaStock || ''}`.toLowerCase();
            return dataStr.includes(filter);
        };
    }

    ngOnInit(): void {
        this.loadMateriasPrimas();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadMateriasPrimas(): void {
        this.isLoading = true;
        const sub = this.abmMateriaPrimaService.getMateriasPrimas().subscribe({
            next: (response) => {
                this.dataSource.data = response.data.page;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar materias primas:', err);
                this.notificationService.showError('No se pudieron cargar las materias primas.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    openEditModal(materiaPrima: IMateriaPrima): void {
        const dialogRef = this.dialog.open(MateriaPrimaModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'edit', materiaPrima }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadMateriasPrimas();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(materiaPrima: IMateriaPrima): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar la materia prima <strong>"${materiaPrima.nombre}"</strong>?`
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
                this.deleteMateriaPrima(materiaPrima.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteMateriaPrima(id: number): void {
        const sub = this.abmMateriaPrimaService.deleteMateriaPrima(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Materia prima eliminada correctamente.');
                this.loadMateriasPrimas();
            },
            error: (err) => {
                if (err.status === 409) {
                    const errorData: IErrorResponse = err.error;
                    this.notificationService.showError(errorData.data);
                } else {
                    console.error('Error al eliminar:', err);
                    this.notificationService.showError('Ocurrió un error al intentar eliminar el elemento.');
                }
            }
        });
        this.subscriptions.add(sub);
    }
}