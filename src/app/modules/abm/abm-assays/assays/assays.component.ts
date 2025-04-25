import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';

// * Interfaces.
import {
  IAssay,
  IAssayResponse,
  IAssaysResponse,
} from 'app/shared/models/assay.interface';

// * Material.
import { MatDialog } from '@angular/material/dialog';

// * Components.
import { ActivatedRoute } from '@angular/router';

// * Dialogs.
import { DateAdapter } from '@angular/material/core';
import { AssayModalComponent } from '../assay-modal/assay-modal.component';
import { AssayDialogAlertComponent } from '../assay-dialog-alert/assay-dialog-alert.component';

@Component({
  selector: 'app-assays',
  templateUrl: './assays.component.html',
})
export class AssaysComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public title: string;

  public assays$: Observable<IAssay[]>;
  // * Table assays.
  public displayedColumnsAssays: string[] = [
    'resultados',
    'maquina',
    'fecha',
    'observaciones',
    'actions',
  ];

  public machineName: string = '';

  private machine: number;
  private lot: number;
  private selectedAssayId: number;
  private selectedAssayName: string;

  constructor(
    private assayService: AssayService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>
  ) { this.dateAdapter.setLocale('es'); }

  public ngOnInit(): void {
    this.route.params.subscribe((params: { id: number }) => {
      this.lot = params?.id;
    });

    if (!this.assayService.lot?.id || !this.lot) {
      return;
    }

    this.assayService.openModal.subscribe(modalData => {
      if (modalData.mode === 'create') {
        this.machine = modalData.machineId;
        this.machineName = modalData.machineName;
        this.openAssayModal('create');
      }
    });

    this.assays$ = this.assayService
      .get(this.lot)
      .pipe(
        map((res: IAssaysResponse | IAssayResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      );

    this.assays$ = this.assayService.assays$;
    this.assayService.fetchAssays(this.assayService.lot.id);
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public ngOnDestroy(): void {
  }

  public edit(assay: IAssay): void {
    this.selectedAssayId = assay.id;
    this.machine = assay.id;
    this.selectedAssayName = assay.maquina;

    this.openAssayAlert('edit', assay, () => {
      this.openAssayModal('edit', assay);
    });
  }

  public view(assay: IAssay): void {
    this.machine = assay.id;
    this.title = assay?.maquina;

    this.openAssayModal('view', assay);
  }

  private openAssayModal(mode: string, assayData?: IAssay): void {
    let data: any = { mode: mode, lotId: this.lot, machineId: this.machine, machineName: this.machineName };

    if (assayData) {
      data.assay = assayData;
    }

    const dialogRef = this.dialog.open(AssayModalComponent, {
      width: '80%',
      data: data,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.assayService.fetchAssays(this.assayService.lot.id);
        this.assayService.resetSelect.next()
      }
    });
  }

  private openAssayAlert(type: 'edit' | 'save', assay?: IAssay, action?: any): void {
    const dialogRef = this.dialog.open(AssayDialogAlertComponent, {
      width: '400px',
      data: {
        type: type,
        machine: assay?.maquina,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        action();
        this.assayService.fetchAssays(this.assayService.lot.id);
        this.assayService.resetSelect.next();
      }
    });
  }
}