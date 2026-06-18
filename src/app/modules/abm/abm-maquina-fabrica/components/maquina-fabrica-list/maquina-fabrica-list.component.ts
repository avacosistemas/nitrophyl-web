import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmMaquinaFabricaService } from '../../abm-maquina-fabrica.service';
import { IMaquinaFabrica, IErrorResponse } from '../../models/maquina-fabrica.interface';
import { MaquinaFabricaModalComponent } from '../maquina-fabrica-modal/maquina-fabrica-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-maquina-fabrica-list',
    templateUrl: './maquina-fabrica-list.component.html',
})
export class MaquinaFabricaListComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IMaquinaFabrica>([]);
    displayedColumns: string[] = ['nombre', 'sector', 'tipo', 'acciones'];

    private subscriptions = new Subscription();

    constructor(
        private abmMaquinaService: AbmMaquinaFabricaService,
        public dialog: MatDialog,
        private notificationService: NotificationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadMaquinas();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadMaquinas(): void {
        this.isLoading = true;
        const sub = this.abmMaquinaService.getMaquinas().subscribe({
            next: (response) => {
                this.dataSource.data = response.data || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar máquinas:', err);
                this.notificationService.showError('No se pudieron cargar las máquinas.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = filterValue;
    }

    getTipoLabel(tipo: string): string {
        const labels: { [key: string]: string } = {
            'PRENSA': 'Prensa',
            'EXTRUSORA_AUTOCLAVE': 'Extrusora Autoclave',
            'INYECTOR': 'Inyector'
        };
        return labels[tipo] || tipo;
    }

    openEditModal(maquina: IMaquinaFabrica): void {
        const dialogRef = this.dialog.open(MaquinaFabricaModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'edit', maquina }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadMaquinas();
            }
        });
        this.subscriptions.add(sub);
    }

    openDeleteDialog(maquina: IMaquinaFabrica): void {
        const message = this.sanitizer.bypassSecurityTrustHtml(
            `¿Estás seguro que deseas eliminar la máquina <strong>"${maquina.nombre}"</strong>?`
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
                this.deleteMaquina(maquina.id);
            }
        });
        this.subscriptions.add(sub);
    }

    private deleteMaquina(id: number): void {
        const sub = this.abmMaquinaService.deleteMaquina(id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Máquina eliminada correctamente.');
                this.loadMaquinas();
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
