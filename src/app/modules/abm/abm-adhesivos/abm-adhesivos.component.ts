import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdhesivosListComponent } from './components/adhesivos-list/adhesivos-list.component';
import { AdhesivoModalComponent } from './components/adhesivo-modal/adhesivo-modal.component';

@Component({
    selector: 'abm-adhesivos',
    templateUrl: './abm-adhesivos.component.html',
    styleUrls: ['./abm-adhesivos.component.scss']
})
export class ABMAdhesivosComponent implements AfterContentChecked {

    public title: string = 'Adhesivos';
    private listComponent: AdhesivosListComponent;

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
        if (component instanceof AdhesivosListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(AdhesivoModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadAdhesivos();
            }
        });
    }
}