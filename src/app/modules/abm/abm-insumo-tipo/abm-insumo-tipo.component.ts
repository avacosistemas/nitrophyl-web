import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InsumoTipoListComponent } from './components/insumo-tipo-list/insumo-tipo-list.component';
import { InsumoTipoModalComponent } from './components/insumo-tipo-modal/insumo-tipo-modal.component';

@Component({
    selector: 'abm-insumo-tipo',
    templateUrl: './abm-insumo-tipo.component.html',
    styleUrls: ['./abm-insumo-tipo.component.scss']
})
export class ABMInsumoTipoComponent implements AfterContentChecked {

    public title: string = 'Tipos de Insumo';
    private listComponent: InsumoTipoListComponent;

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
        if (component instanceof InsumoTipoListComponent) {
            this.listComponent = component;
        }
    }

    private openCreateModal(): void {
        const dialogRef = this.dialog.open(InsumoTipoModalComponent, {
            width: '600px',
            disableClose: true,
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true && this.listComponent) {
                this.listComponent.loadInsumoTipos();
            }
        });
    }
}