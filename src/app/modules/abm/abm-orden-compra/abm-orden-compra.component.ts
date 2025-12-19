import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OrdenCompraListComponent } from './components/orden-compra-list/orden-compra-list.component';
import { OrdenCompraModalComponent } from './components/orden-compra-modal/orden-compra-modal.component';

@Component({
    selector: 'abm-orden-compra',
    templateUrl: './abm-orden-compra.component.html'
})
export class ABMOrdenCompraComponent implements AfterContentChecked {
    title: string = 'Órdenes de Compra';
    private listComponent: OrdenCompraListComponent;

    constructor(public dialog: MatDialog, private cdref: ChangeDetectorRef) { }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }

    handleAction(action: string): void {
        if (action === 'create') {
            this.openCreateModal();
        }
    }

    onChildActivate(component: any): void {
        if (component instanceof OrdenCompraListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(OrdenCompraModalComponent, {
            width: '600px',
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.search();
            }
        });
    }
}