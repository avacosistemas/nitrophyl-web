import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SectorFabricaListComponent } from './components/sector-fabrica-list/sector-fabrica-list.component';
import { SectorFabricaModalComponent } from './components/sector-fabrica-modal/sector-fabrica-modal.component';

@Component({
    selector: 'abm-sector-fabrica',
    templateUrl: './abm-sector-fabrica.component.html',
    styleUrls: ['./abm-sector-fabrica.component.scss']
})
export class ABMSectorFabricaComponent implements AfterContentChecked {

    public title: string = 'Sectores Fábrica';
    private listComponent!: SectorFabricaListComponent;

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
        if (component instanceof SectorFabricaListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(SectorFabricaModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadSectores();
            }
        });
    }
}
