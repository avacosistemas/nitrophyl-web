import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InsumosListComponent } from './components/insumos-list/insumos-list.component';
import { InsumoModalComponent } from './components/insumo-modal/insumo-modal.component';

@Component({
    selector: 'abm-insumos',
    templateUrl: './abm-insumos.component.html',
    styleUrls: ['./abm-insumos.component.scss']
})
export class ABMInsumosComponent implements AfterContentChecked {

    public title: string = 'Insumos';
    private listComponent: InsumosListComponent;

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
        if (component instanceof InsumosListComponent) {
            this.listComponent = component;
        }
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