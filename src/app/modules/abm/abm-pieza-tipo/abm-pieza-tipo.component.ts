import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PiezaTiposListComponent } from './components/pieza-tipos-list/pieza-tipos-list.component';
import { PiezaTipoModalComponent } from './components/pieza-tipo-modal/pieza-tipo-modal.component';

@Component({
  selector: 'abm-pieza-tipo',
  templateUrl: './abm-pieza-tipo.component.html',
  styleUrls: ['./abm-pieza-tipo.component.scss']
})
export class ABMPiezaTipoComponent implements AfterContentChecked {

  public title: string = 'Tipos de Pieza';
  private listComponent: PiezaTiposListComponent;

  constructor(
    public dialog: MatDialog,
    private cdref: ChangeDetectorRef
  ) { }

  public ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  handleAction(action: string): void {
    switch (action) {
      case 'create':
        this.openCreateModal();
        break;
    }
  }

  onChildActivate(component: any): void {
    if (component instanceof PiezaTiposListComponent) {
      this.listComponent = component;
    }
  }

  private openCreateModal(): void {
    const dialogRef = this.dialog.open(PiezaTipoModalComponent, {
      width: '500px',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true && this.listComponent) {
        this.listComponent.loadPiezaTipos();
      }
    });
  }
}