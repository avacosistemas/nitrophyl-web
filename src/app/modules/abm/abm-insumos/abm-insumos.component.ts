import { Component, ChangeDetectorRef, AfterContentChecked, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { InsumosListComponent } from './components/insumos-list/insumos-list.component';
import { InsumoModalComponent } from './components/insumo-modal/insumo-modal.component';
import { InsumoStockComponent } from './components/insumo-stock/insumo-stock.component';

@Component({
    selector: 'abm-insumos',
    templateUrl: './abm-insumos.component.html',
    styleUrls: ['./abm-insumos.component.scss']
})
export class ABMInsumosComponent implements AfterContentChecked, OnDestroy {

    public title: string = 'Insumos';
    public subtitle: string;
    public breadcrumbs: any[] = [];
    public buttons: any[] = [];

    private listComponent: InsumosListComponent;
    private stockComponent: InsumoStockComponent;
    private childSubscription: Subscription;

    constructor(
        public dialog: MatDialog,
        private cdref: ChangeDetectorRef,
        private router: Router
    ) { }

    public ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }
    
    ngOnDestroy(): void {
        this.childSubscription?.unsubscribe();
    }

    handleAction(action: string): void {
        if (action === 'create' && this.listComponent) {
            this.openCreateModal();
        } else if (action === 'updateStock' && this.stockComponent) {
            this.stockComponent.openUpdateStockModal();
        } else if (action === 'goBack') {
            this.router.navigate(['/insumos/grid']);
        }
    }

    onChildActivate(component: any): void {
        this.childSubscription?.unsubscribe();
        this.listComponent = null;
        this.stockComponent = null;

        if (component instanceof InsumosListComponent) {
            this.listComponent = component;
            this.setupListViewHeader();
        } else if (component instanceof InsumoStockComponent) {
            this.stockComponent = component;
            this.setupStockViewHeaderLoading();
            this.childSubscription = this.stockComponent.insumo$.subscribe(insumo => {
                if (insumo) {
                    this.setupStockViewHeader(insumo.nombre);
                }
            });
        }
    }
    
    private setupListViewHeader(): void {
        this.title = 'Insumos';
        this.subtitle = null;
        this.breadcrumbs = [
            { title: 'Producción', route: [], condition: true },
            { title: 'Insumos', route: ['/insumos/grid'], condition: true }
        ];
        this.buttons = [{
            type: 'flat',
            label: 'Crear Insumo',
            condition: true,
            isDisabled: false,
            action: 'create'
        }];
    }
    
    private setupStockViewHeader(nombreInsumo: string): void {
        this.title = 'Historial de Stock';
        this.subtitle = nombreInsumo;
        this.breadcrumbs = [
            { title: 'Producción', route: [], condition: true },
            { title: 'Insumos', route: ['/insumos/grid'], condition: true },
            { title: 'Historial de Stock', route: [], condition: true }
        ];
        this.buttons = [
            {
                type: 'stroked',
                label: 'Volver',
                condition: true,
                isDisabled: false,
                action: 'goBack',
                icon: 'arrow_back'
            },
            {
                type: 'flat',
                label: 'Actualizar Stock',
                condition: true,
                isDisabled: false,
                action: 'updateStock'
            }
        ];
    }

    private setupStockViewHeaderLoading(): void {
        this.title = 'Cargando...';
        this.subtitle = null;
        this.breadcrumbs = [
            { title: 'Producción', route: [], condition: true },
            { title: 'Insumos', route: ['/insumos/grid'], condition: true },
            { title: 'Historial de Stock', route: [], condition: true }
        ];
        this.buttons = [
            {
                type: 'stroked',
                label: 'Volver',
                condition: true,
                isDisabled: false,
                action: 'goBack',
                icon: 'arrow_back'
            }
        ];
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(InsumoModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadInsumos();
            }
        });
    }
}