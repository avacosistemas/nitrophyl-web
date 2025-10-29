import { Component, ChangeDetectorRef, AfterContentChecked, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MateriaPrimaListComponent } from './components/materia-prima-list/materia-prima-list.component';
import { MateriaPrimaModalComponent } from './components/materia-prima-modal/materia-prima-modal.component';
import { MateriaPrimaStockComponent } from './components/materia-prima-stock/materia-prima-stock.component';
import { Router } from '@angular/router';

@Component({
    selector: 'abm-materiaprima',
    templateUrl: './abm-materiaprima.component.html',
    styleUrls: ['./abm-materiaprima.component.scss']
})
export class ABMMateriaPrimaComponent implements AfterContentChecked, OnDestroy {

    public title: string = 'Materias Primas';
    public subtitle: string;
    public breadcrumbs: any[] = [];
    public buttons: any[] = [];

    private listComponent: MateriaPrimaListComponent;
    private stockComponent: MateriaPrimaStockComponent;
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
            this.router.navigate(['/materias-primas/grid']);
        }
    }

    onChildActivate(component: any): void {
        this.childSubscription?.unsubscribe();
        this.listComponent = null;
        this.stockComponent = null;

        if (component instanceof MateriaPrimaListComponent) {
            this.listComponent = component;
            this.setupListViewHeader();
        } else if (component instanceof MateriaPrimaStockComponent) {
            this.stockComponent = component;
            this.setupStockViewHeaderLoading();
            this.childSubscription = this.stockComponent.materiaPrima$.subscribe(mp => {
                if (mp) {
                    this.setupStockViewHeader(mp.nombre);
                }
            });
        }
    }

    private setupListViewHeader(): void {
        this.title = 'Materias Primas';
        this.subtitle = null;
        this.breadcrumbs = [
            { title: 'Producción', route: [], condition: true },
            { title: 'Materias Primas', route: ['/materias-primas/grid'], condition: true }
        ];
        this.buttons = [{
            type: 'flat',
            label: 'Crear Materia Prima',
            condition: true,
            isDisabled: false,
            action: 'create'
        }];
    }

    private setupStockViewHeader(nombreMateriaPrima: string): void {
        this.title = 'Historial de Stock';
        this.subtitle = nombreMateriaPrima;
        this.breadcrumbs = [
            { title: 'Producción', route: [], condition: true },
            { title: 'Materias Primas', route: ['/materias-primas/grid'], condition: true },
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
            { title: 'Materias Primas', route: ['/materias-primas/grid'], condition: true },
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
        const dialogRef = this.dialog.open(MateriaPrimaModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadMateriasPrimas();
            }
        });
    }
}