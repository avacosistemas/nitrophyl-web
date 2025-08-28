import { AfterContentChecked, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CotizacionesListComponent } from './components/cotizaciones-list/cotizaciones-list.component';
import { CotizacionModalComponent } from './components/cotizacion-modal/cotizacion-modal.component';

@Component({
    selector: 'app-cotizaciones',
    templateUrl: './cotizaciones.component.html',
    styleUrls: ['./cotizaciones.component.scss']
})
export class CotizacionesComponent implements AfterContentChecked {

    public title: string = 'Cotizaciones';
    private listComponent: CotizacionesListComponent;

    constructor(
        public dialog: MatDialog,
        private cdref: ChangeDetectorRef
    ) { }

    public ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }

    handleAction(action: string): void {
        if (action === 'create') {
            this.openCreateModal();
        }
    }

    onChildActivate(component: any): void {
        if (component instanceof CotizacionesListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(CotizacionModalComponent, {
            width: '600px',
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.refreshData();
            }
        });
    }
}