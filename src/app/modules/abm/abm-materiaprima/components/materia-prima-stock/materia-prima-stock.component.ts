import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, BehaviorSubject } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { AbmMateriaPrimaService } from '../../abm-materiaprima.service';
import { IMateriaPrima, IMateriaPrimaStockHistorial } from '../../models/materia-prima.interface';
import { MateriaPrimaStockModalComponent } from '../materia-prima-stock-modal/materia-prima-stock-modal.component';

@Component({
    selector: 'app-materia-prima-stock',
    templateUrl: './materia-prima-stock.component.html',
})
export class MateriaPrimaStockComponent implements OnInit, OnDestroy {
    isLoading = true;
    dataSource = new MatTableDataSource<IMateriaPrimaStockHistorial>([]);
    displayedColumns: string[] = ['fecha', 'tipo', 'cantidad'];
    
    private materiaPrima: IMateriaPrima;
    private subscriptions = new Subscription();

    public materiaPrimaSubject = new BehaviorSubject<IMateriaPrima | null>(null);
    public materiaPrima$ = this.materiaPrimaSubject.asObservable();

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
        private abmMateriaPrimaService: AbmMateriaPrimaService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        const state = history.state;

        if (state && state.materiaPrima) {
            this.materiaPrima = state.materiaPrima;
            this.materiaPrimaSubject.next(this.materiaPrima);
            this.loadStockHistory();
        } else {
            this.notificationService.showInfo('Por favor, seleccione una materia prima de la lista.');
            this.router.navigate(['/materias-primas/grid']);
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.materiaPrimaSubject.complete();
    }

    loadStockHistory(): void {
        if (!this.materiaPrima) { return; }

        this.isLoading = true;
        const sub = this.abmMateriaPrimaService.getMateriaPrimaStockHistorial(this.materiaPrima.id).subscribe({
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

        const dialogRef = this.dialog.open(MateriaPrimaStockModalComponent, {
            width: '600px',
            disableClose: true,
            data: {
                idMateriaPrima: this.materiaPrima.id,
                unidadMedida: this.materiaPrima.unidadMedidaStock,
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