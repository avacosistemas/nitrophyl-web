import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmSectorFabricaService } from '../../abm-sector-fabrica.service';
import { ISectorFabrica, IErrorResponse } from '../../models/sector-fabrica.interface';
import { SectorFabricaModalComponent } from '../sector-fabrica-modal/sector-fabrica-modal.component';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';

@Component({
    selector: 'app-sector-fabrica-list',
    templateUrl: './sector-fabrica-list.component.html',
})
export class SectorFabricaListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<ISectorFabrica>([]);
    displayedColumns: string[] = ['nombre', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmSectorService: AbmSectorFabricaService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadSectores();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadSectores(): void {
        this.isLoading = true;
        const sub = this.abmSectorService.getSectores().subscribe({
            next: (response) => {
                this.dataSource.data = response.data || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar sectores:', err);
                this.notificationService.showError('No se pudieron cargar los sectores.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = filterValue;
    }

    openEditModal(sector: ISectorFabrica): void {
        const dialogRef = this.dialog.open(SectorFabricaModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'edit', sector }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadSectores();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(sector: ISectorFabrica): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar el sector <strong>"${sector.nombre}"</strong>?`
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
                this.deleteSector(sector.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteSector(id: number): void {
        const sub = this.abmSectorService.deleteSector(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Sector eliminado correctamente.');
                this.loadSectores();
            },
            error: (err) => {
                if (err.status === 409) {
                    const errorData: IErrorResponse = err.error;
                    this.notificationService.showError(errorData.data || 'El elemento está en uso y no puede ser eliminado.');
                } else {
                    console.error('Error al eliminar:', err);
                    this.notificationService.showError('Ocurrió un error al intentar eliminar el elemento.');
                }
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }
}
