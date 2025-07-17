import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmInsumoTipoService } from '../../abm-insumo-tipo.service';
import { IInsumoTipo, IErrorResponse } from '../../models/insumo-tipo.interface';
import { InsumoTipoModalComponent } from '../insumo-tipo-modal/insumo-tipo-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-insumo-tipo-list',
    templateUrl: './insumo-tipo-list.component.html',
})
export class InsumoTipoListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IInsumoTipo>([]);
    displayedColumns: string[] = ['nombre', 'padre', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmInsumoTipoService: AbmInsumoTipoService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {
        this.dataSource.filterPredicate = (data: IInsumoTipo, filter: string): boolean => {
            const dataStr = `${data.nombre} ${data.padre?.nombre || ''}`.toLowerCase();
            return dataStr.includes(filter);
        };
    }

    ngOnInit(): void {
        this.loadInsumoTipos();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadInsumoTipos(): void {
        this.isLoading = true;
        const sub = this.abmInsumoTipoService.getInsumoTipos().subscribe({
            next: (response) => {
                this.dataSource.data = response;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar tipos de insumos:', err);
                this.notificationService.showError('No se pudieron cargar los tipos de insumos.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    openEditModal(insumoTipo: IInsumoTipo): void {
        const dialogRef = this.dialog.open(InsumoTipoModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'edit', insumoTipo }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadInsumoTipos();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(insumoTipo: IInsumoTipo): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar el tipo de insumo <strong>"${insumoTipo.nombre}"</strong>?`
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
                this.deleteInsumoTipo(insumoTipo.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteInsumoTipo(id: number): void {
        const sub = this.abmInsumoTipoService.deleteInsumoTipo(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Tipo de insumo eliminado correctamente.');
                this.loadInsumoTipos();
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