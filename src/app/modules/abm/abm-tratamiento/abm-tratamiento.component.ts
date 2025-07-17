import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TratamientoListComponent } from './components/tratamiento-list/tratamiento-list.component';
import { TratamientoModalComponent } from './components/tratamiento-modal/tratamiento-modal.component';

@Component({
    selector: 'abm-tratamientos',
    templateUrl: './abm-tratamiento.component.html',
    styleUrls: ['./abm-tratamiento.component.scss']
})
export class ABMTratamientosComponent implements AfterContentChecked {

    public title: string = 'Tratamientos';
    private listComponent: TratamientoListComponent;

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
        if (component instanceof TratamientoListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(TratamientoModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadTratamientos();
            }
        });
    }
}