import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaquinaFabricaListComponent } from './components/maquina-fabrica-list/maquina-fabrica-list.component';
import { MaquinaFabricaModalComponent } from './components/maquina-fabrica-modal/maquina-fabrica-modal.component';

@Component({
    selector: 'abm-maquina-fabrica',
    templateUrl: './abm-maquina-fabrica.component.html',
    styleUrls: ['./abm-maquina-fabrica.component.scss']
})
export class ABMMaquinaFabricaComponent implements AfterContentChecked {

    public title: string = 'Máquinas Fábrica';
    private listComponent!: MaquinaFabricaListComponent;

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
        if (component instanceof MaquinaFabricaListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(MaquinaFabricaModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadMaquinas();
            }
        });
    }
}
