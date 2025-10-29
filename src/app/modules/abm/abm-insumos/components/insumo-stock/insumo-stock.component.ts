import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, BehaviorSubject } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmInsumosService } from '../../abm-insumos.service';
import { IInsumo, IInsumoStockHistorial } from '../../models/insumo.interface';
import { InsumoStockModalComponent } from '../insumo-stock-modal/insumo-stock-modal.component';

@Component({
    selector: 'app-insumo-stock',
    templateUrl: './insumo-stock.component.html',
})
export class InsumoStockComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IInsumoStockHistorial>([]);
    displayedColumns: string[] = ['fecha', 'tipo', 'cantidad', 'observaciones'];
    
    private insumo: IInsumo;
    private unidadMedida: string;
    private subscriptions = new Subscription();

    public insumoSubject = new BehaviorSubject<IInsumo | null>(null);
    public insumo$ = this.insumoSubject.asObservable();

    tipoMapping = {
        'STOCK_INICIAL': 'Stock Inicial',
        'INGRESO': 'Ingreso',
        'DESPERDICIO': 'Desperdicio',
        'RECUENTO_ANUAL': 'Recuento Anual'
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dialog: MatDialog,
        private abmInsumosService: AbmInsumosService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        const state = history.state;

        if (state && state.insumo) {
            this.insumo = state.insumo;
            this.unidadMedida = state.unidadMedida;
            this.insumoSubject.next(this.insumo);
            this.loadStockHistory();
        } else {
            this.notificationService.showInfo('Por favor, seleccione un insumo de la lista.');
            this.router.navigate(['/insumos/grid']);
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.insumoSubject.complete();
    }

    loadStockHistory(): void {
        if (!this.insumo) { return; }

        this.isLoading = true;
        const sub = this.abmInsumosService.getInsumoStockHistorial(this.insumo.id).subscribe({
            next: (response) => {
                this.dataSource.data = response.data.page;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar historial de stock:', err);
                this.notificationService.showError('No se pudo cargar el historial de stock.');
                this.isLoading = false;
            }
        });
        this.subscriptions.add(sub);
    }

    public openUpdateStockModal(): void {
        const isGridEmpty = this.dataSource.data.length === 0;

        const dialogRef = this.dialog.open(InsumoStockModalComponent, {
            width: '600px',
            disableClose: true,
            data: {
                idInsumo: this.insumo.id,
                unidadMedida: this.unidadMedida,
                isGridEmpty: isGridEmpty
            }
        });

        const sub = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.loadStockHistory();
            }
        });
        this.subscriptions.add(sub);
    }
}