import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmInsumosService } from '../../abm-insumos.service';
import { IInsumo, IErrorResponse } from '../../models/insumo.interface';
import { InsumoModalComponent } from '../insumo-modal/insumo-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-insumos-list',
    templateUrl: './insumos-list.component.html',
})
export class InsumosListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IInsumo>([]);
    displayedColumns: string[] = ['nombre', 'tipoNombre', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmInsumosService: AbmInsumosService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {
        this.dataSource.filterPredicate = (data: IInsumo, filter: string): boolean => {
            const dataStr = `${data.nombre} ${data.tipoNombre || ''}`.toLowerCase();
            return dataStr.includes(filter);
        };
    }

    ngOnInit(): void {
        this.loadInsumos();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadInsumos(): void {
        this.isLoading = true;
        const sub = this.abmInsumosService.getInsumos().subscribe({
            next: (response) => {
                this.dataSource.data = response.data.page;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar insumos:', err);
                this.notificationService.showError('No se pudieron cargar los insumos.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    openEditModal(insumo: IInsumo): void {
        const dialogRef = this.dialog.open(InsumoModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'edit', insumo }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadInsumos();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(insumo: IInsumo): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar el insumo <strong>"${insumo.nombre}"</strong>?`
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
                this.deleteInsumo(insumo.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteInsumo(id: number): void {
        const sub = this.abmInsumosService.deleteInsumo(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Insumo eliminado correctamente.');
                this.loadInsumos();
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