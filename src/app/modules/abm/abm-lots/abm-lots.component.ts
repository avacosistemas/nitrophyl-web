import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LotModalComponent } from 'app/modules/abm/abm-lots/lot-modal/lot-modal.component';
import { LotUpdateService } from 'app/shared/services/lot-update.service';

@Component({
  selector: 'abm-lots',
  templateUrl: './abm-lots.component.html',
  styleUrls: ['./abm-lots.component.css'],
})
export class ABMLotsComponent implements OnInit, AfterContentChecked, OnDestroy {
  public title: string = 'Consultar Lotes';

  constructor(
    private dialog: MatDialog,
    private cdref: ChangeDetectorRef,
    private lotUpdateService: LotUpdateService
  ) {}

  ngOnInit(): void {}

  ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  handleAction(action: string): void {
    switch (action) {
      case 'create':
        this.create();
        break;
    }
  }

  public async create(): Promise<void> {
    const dialogRef = this.dialog.open(LotModalComponent, {
      width: '420px',
      data: { isEditing: false },
      autoFocus: false,
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result && result.action === 'create') {
      this.cdref.detectChanges();
      this.lotUpdateService.requestUpdate();
    }
  }

  public async edit(idLote: number): Promise<void> {
    const dialogRef = this.dialog.open(LotModalComponent, {
      width: '420px',
      data: { isEditing: true, lotId: idLote },
      autoFocus: false,
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result && result.action === 'edit') {
      this.cdref.detectChanges();
      this.lotUpdateService.requestUpdate();
    }
  }

  ngOnDestroy(): void {}
}
