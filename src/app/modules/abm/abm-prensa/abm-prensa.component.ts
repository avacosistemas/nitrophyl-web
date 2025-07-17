import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PrensaListComponent } from './components/prensa-list/prensa-list.component';
import { PrensaModalComponent } from './components/prensa-modal/prensa-modal.component';

@Component({
    selector: 'abm-prensas',
    templateUrl: './abm-prensa.component.html',
    styleUrls: ['./abm-prensa.component.scss']
})
export class ABMPrensasComponent implements AfterContentChecked {

    public title: string = 'Prensas';
    private listComponent: PrensaListComponent;

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
        if (component instanceof PrensaListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(PrensaModalComponent, {
            width: '500px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadPrensas();
            }
        });
    }
}