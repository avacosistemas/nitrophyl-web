import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TransportesListComponent } from './components/transportes-list/transportes-list.component';
import { TransporteModalComponent } from './components/transporte-modal/transporte-modal.component';

@Component({
    selector: 'abm-transportes',
    templateUrl: './abm-transportes.component.html',
    styleUrls: ['./abm-transportes.component.scss']
})
export class ABMTransportesComponent implements AfterContentChecked {

    public title: string = 'Transportes';
    private listComponent: TransportesListComponent;

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
        if (component instanceof TransportesListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(TransporteModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadTransportes();
            }
        });
    }
}
