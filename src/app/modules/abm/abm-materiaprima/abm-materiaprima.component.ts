import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MateriaPrimaListComponent } from './components/materia-prima-list/materia-prima-list.component';
import { MateriaPrimaModalComponent } from './components/materia-prima-modal/materia-prima-modal.component';

@Component({
    selector: 'abm-materiaprima',
    templateUrl: './abm-materiaprima.component.html',
    styleUrls: ['./abm-materiaprima.component.scss']
})
export class ABMMateriaPrimaComponent implements AfterContentChecked {

    public title: string = 'Materias Primas';
    private listComponent: MateriaPrimaListComponent;

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
        if (component instanceof MateriaPrimaListComponent) {
            this.listComponent = component;
        }
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