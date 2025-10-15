import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, of, startWith, Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';
import { FormulasService } from 'app/shared/services/formulas.service';
import { LotService } from 'app/shared/services/lot.service';
import { LotUpdateService } from 'app/shared/services/lot-update.service';
// * Interfaces.
import {
  IFormula,
  IFormulaResponse,
  IFormulasResponse,
} from 'app/shared/models/formula.interface';
import { ILot, ILotsResponse } from 'app/shared/models/lot.interface';

// * Material.
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

// * Dialogs.
import { DatePipe } from '@angular/common';
import { LotDialogComponent } from '../lot-dialog/lot-dialog.component';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MAT_MOMENT_DATE_FORMATS,
} from '@angular/material-moment-adapter';
import moment from 'moment';
import { MatSort, MatSortable, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IResponse } from 'app/shared/models/response.interface';
import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
} from '@angular/core';

import { LotModalComponent } from 'app/modules/abm/abm-lots/lot-modal/lot-modal.component';
import { LotGraphicDialogComponent } from '../lot-graphic-dialog/lot-graphic-dialog.component';
import { ExportDataComponent } from 'app/modules/prompts/export-data/export-data.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { saveAs } from 'file-saver';

export interface Estado {
  idEstado: string;
  value: string;
}

@Component({
  selector: 'app-lots',
  templateUrl: './lots.component.html',
  styleUrls: ['./lots.component.css'],
  providers: [
    // The locale would typically be provided on the root module of your application. We do it at
    // the component level here, due to limitations of our example generation script.
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },

    // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
    // `MatMomentDateModule` in your applications root module. We provide it at the component level
    // here, due to limitations of our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ],
})
export class LotsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(ExportDataComponent) exportDataComponent: ExportDataComponent;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChildren('campoInput') inputs!: QueryList<ElementRef>;

  public component: string = 'all';
  public lots$: Observable<ILot[]>;
  public formulas$: Observable<IFormula[]>;
  public formulasCreate$: Observable<IFormula[]>;
  public panelOpenState: boolean;
  public formFilter: FormGroup;

  public formulaFail: boolean = false;

  public formulas: IFormula[];

  public displayedColumns: string[] = [
    'estado',
    'nroLote',
    'formula',
    'fecha',
    'observaciones',
    'fechaEstado',
    'observacionesEstado',
    'actions',
  ];

  lots: ILot[];
  sortedData: ILot[];
  dataSource = new MatTableDataSource<ILot>([]);
  totalRecords = 0;
  pageSize = 15;
  pageIndex = 0;
  searching: boolean;
  estados: Estado[] = [
    { idEstado: 'PENDIENTE_APROBACION', value: 'Pendiente Aprobación' },
    { idEstado: 'RECHAZADO', value: 'Rechazado' },
    { idEstado: 'APROBADO', value: 'Aprobado' },
    { idEstado: 'APROBADO_OBSERVADO', value: 'Aprobado con observaciones' },
  ];
  exporting: boolean = false;
  private updateSubscription: Subscription;

  constructor(
    private lotService: LotService,
    private formulaService: FormulasService,
    private assayService: AssayService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private _dPipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private formBuilder: FormBuilder,
    private cdref: ChangeDetectorRef,
    private lotUpdateService: LotUpdateService,
    private sanitizer: DomSanitizer
  ) {
    this.dateAdapter.setLocale('es');
  }

  public ngOnInit(): void {
    this.updateSubscription = this.lotUpdateService.updateTable$.subscribe(() => {
      this.search();
    });
    this.setForm();
    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
        this.formulas$ = this.formFilter.controls['idFormula'].valueChanges.pipe(
          startWith(''),
          map((value: string | IFormula) => {
            const searchValue =
              typeof value === 'string' ? value : value?.nombre || '';
            return searchValue
              ? this._filter(searchValue)
              : this.formulas.slice();
          })
        );
      });

    const estadoFind = this.estados.find((value) => {
      if (value.value === this.formFilter.controls['estado'].value) {
        return true;
      }
      return false;
    });

    this.lots$ = this.lotService
      .getByFilter(
        this.formFilter.controls['idFormula'].value != null
          ? this.formFilter.controls['idFormula'].value.id
          : null,
        this.formFilter.controls['nroLote'].value,
        null,
        null,
        estadoFind != null ? estadoFind.idEstado : null,
        this.pageSize,
        this.pageIndex,
        'nroLote',
        true
      )
      .pipe(map((res: ILotsResponse) => res.data));
    this.lots$.subscribe((value) => {
      this.dataSource = new MatTableDataSource<ILot>(value);
    });

    const lotsCount$ = this.lotService
      .countByFilter(
        this.formFilter.controls['idFormula'].value != null
          ? this.formFilter.controls['idFormula'].value.id
          : null,
        this.formFilter.controls['nroLote'].value,
        null,
        null,
        estadoFind != null ? estadoFind.idEstado : null,
        this.pageSize,
        this.pageIndex,
        'nroLote',
        true
      )
      .pipe(map((res: IResponse<number>) => res.data));
    lotsCount$.subscribe(value => (this.totalRecords = value));
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }

    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.sort.sort({ id: 'nroLote', start: 'desc' } as MatSortable);
    this.dataSource.sort = this.sort;
    this.cdref.detectChanges();
  }

  public displayFn(formula: IFormula | null): string {
    return formula && formula.nombre ? formula.nombre : '';
  }

  public displayEstado(formula: any): string {
    return formula;
  }

  public get(row: ILot): void {
    this.assayService.lot = row;
    this.router.navigate([`../../ensayos/${row.id}`]);
  }

  public set(lote: ILot, status: string): void {
    this._dialog(lote, status);
  }

  public openCreateModal(): void {
    const dialogRef = this.dialog.open(LotModalComponent, {
      width: '420px',
      data: { isEditing: false },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'create') {
        this.forceSearch();
      }
    });
  }

  public edit(idLote: number): void {
    const dialogRef = this.dialog.open(LotModalComponent, {
      width: '420px',
      data: { isEditing: true, lotId: idLote },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'edit') {
        this.cdref.detectChanges();
        this.forceSearch();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  limpiarCampo(campo: string): void {
    this.formFilter.controls[campo].setValue(null);
    this.formFilter.controls[campo].markAsPristine();
    this.formFilter.controls[campo].markAsUntouched();

    const inputIndex =
      campo === 'idFormula' ? 2 : campo === 'fechaDesde' ? 0 : campo === 'fechaHasta' ? 1 : 3;
    const input = this.inputs.toArray()[inputIndex];

    if (input) {
      setTimeout(() => input.nativeElement.blur(), 0);
    }
  }

  validarFechas(fechaAprobacion: string, loteFecha: string): boolean {
    if (fechaAprobacion == null) {
      return false;
    }
    const fechaAprobacionDate: Date = new Date(fechaAprobacion);
    const inputDate = new Date(fechaAprobacionDate.toDateString());

    const dateMomentObject = moment(loteFecha, 'DD/MM/YYYY');
    const dateObject = dateMomentObject.toDate();
    const strFechaCreacion: string = this._dPipe.transform(
      dateObject,
      'dd/MM/yyyy'
    );
    const strFechaAprobacion: string = this._dPipe.transform(
      inputDate,
      'dd/MM/yyyy'
    );
    if (strFechaAprobacion < strFechaCreacion) {
      return false;
    }
    return true;
  }

  sortData(sort: Sort): void {
    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde'].value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta'].value,
      'dd/MM/yyyy'
    );

    const estadoFind = this.estados.find((value) => {
      if (value.value === this.formFilter.controls['estado'].value) {
        return true;
      }
      return false;
    });

    this.lots$ = this.lotService
      .getByFilter(
        this.formFilter.controls['idFormula'].value != null
          ? this.formFilter.controls['idFormula'].value.id
          : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null,
        this.pageSize,
        this.pageIndex,
        sort.active,
        sort.direction === 'asc' ? true : false
      )
      .pipe(map((res: ILotsResponse) => res.data));

    this.lots$.subscribe({
      next: (value) => {
        this.dataSource = new MatTableDataSource<ILot>(value);
        this.cdref.detectChanges();
      },
    });

    const lotsCount$ = this.lotService
      .countByFilter(
        this.formFilter.controls['idFormula'].value != null
          ? this.formFilter.controls['idFormula'].value.id
          : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null,
        this.pageSize,
        this.pageIndex,
        sort.active,
        sort.direction === 'asc' ? true : false
      )
      .pipe(map((res: IResponse<number>) => res.data));
    lotsCount$.subscribe((value) => {
      this.totalRecords = value;
    });
  }

  getPagedData(): void {
    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde']?.value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta']?.value,
      'dd/MM/yyyy'
    );

    const estadoFind = this.estados.find(
      value => value.value === this.formFilter.controls['estado']?.value
    );

    this.lots$ = this.lotService
      .getByFilter(
        this.formFilter.controls['idFormula']?.value?.id || null,
        this.formFilter.controls['nroLote']?.value || null,
        dateT || null,
        dateF || null,
        estadoFind?.idEstado || null,
        this.pageSize,
        this.pageIndex,
        this.sort.active ? this.sort.active : 'nroLote',
        this.sort.direction === 'asc' ? true : false
      )
      .pipe(map((res: ILotsResponse) => res.data));

    this.lots$.subscribe({
      next: (value) => {
        this.dataSource = new MatTableDataSource<ILot>(value);
        this.cdref.detectChanges();
      },
    });

    const lotsCount$ = this.lotService
      .countByFilter(
        this.formFilter.controls['idFormula']?.value?.id || null,
        this.formFilter.controls['nroLote']?.value || null,
        dateT || null,
        dateF || null,
        estadoFind?.idEstado || null,
        this.pageSize,
        this.pageIndex,
        this.sort.active ? this.sort.active : 'nroLote',
        this.sort.direction === 'asc' ? true : false
      )
      .pipe(map((res: IResponse<number>) => res.data));

    lotsCount$.subscribe((value) => {
      this.totalRecords = value;
    });
  }

  pageChangeEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getPagedData();
  }

  limpiar(): void {
    this.formFilter.reset();
    this.estados = [
      { idEstado: 'PENDIENTE_APROBACION', value: 'Pendiente Aprobación' },
      { idEstado: 'RECHAZADO', value: 'Rechazado' },
      { idEstado: 'APROBADO', value: 'Aprobado' },
      { idEstado: 'APROBADO_OBSERVADO', value: 'Aprobado con observaciones' },
    ];
  }

  public delete(lote: ILot): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '40%',
      data: { data: lote.nroLote, seccion: 'lote', boton: 'Eliminar' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.lotService.delete(lote.id).subscribe((response) => {
          if (response.status === 'OK') {
            this.lots$ = this.lotService
              .get()
              .pipe(map((res: ILotsResponse) => res.data));
            this.openSnackBar(true, null);
            this.search();
          } else {
            this.openSnackBar(false, response.error);
          }
        });
      }
    });
  }

  public forceSearch(): void {
    this.search();
  }

  async search(): Promise<void> {
    if (!this.formFilter) {
      console.error('formFilter is undefined');
      return;
    }

    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde']?.value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta']?.value,
      'dd/MM/yyyy'
    );

    const estadoFind = this.estados.find(
      value => value.value === this.formFilter.controls['estado']?.value
    );

    this.pageIndex = 0;

    this.lots$ = this.lotService
      .getByFilter(
        this.formFilter.controls['idFormula']?.value?.id || null,
        this.formFilter.controls['nroLote']?.value || null,
        dateT || null,
        dateF || null,
        estadoFind?.idEstado || null,
        this.pageSize,
        this.pageIndex,
        this.sort.active ? this.sort.active : 'nroLote',
        this.sort.direction === 'asc' ? true : false
      )
      .pipe(map((res: ILotsResponse) => res.data));

    this.lots$.subscribe({
      next: (value) => {
        this.dataSource = new MatTableDataSource<ILot>(value);
        this.cdref.detectChanges();
      },
    });

    const lotsCount$ = this.lotService
      .countByFilter(
        this.formFilter.controls['idFormula']?.value?.id || null,
        this.formFilter.controls['nroLote']?.value || null,
        dateT || null,
        dateF || null,
        estadoFind?.idEstado || null,
        this.pageSize,
        this.pageIndex,
        this.sort.active ? this.sort.active : 'nroLote',
        this.sort.direction === 'asc' ? true : false
      )
      .pipe(map((res: IResponse<number>) => res.data));

    lotsCount$.subscribe((value) => {
      this.totalRecords = value;
    });
  }

  onEnter(event: KeyboardEvent): void {
    event.preventDefault();
    this.search();
  }

  onGetAllData(event: { tipo: string; scope: string }): void {
    if (event.scope === 'pagina') {
      this.exportarPaginaActual(event.tipo);
    } else if (event.scope === 'todo') {
      this.cargarTodosLosDatosParaExportar(event.tipo);
    }
  }

  exportarPaginaActual(tipo: string): void {
    const formattedData = this.formatDataForExport(this.dataSource.data);
    this.procesarExportacion(tipo, formattedData);
  }

  cargarTodosLosDatosParaExportar(tipo: string): void {

    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde']?.value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta']?.value,
      'dd/MM/yyyy'
    );

    const estadoFind = this.estados.find(
      value => value.value === this.formFilter.controls['estado']?.value
    );

    this.exporting = true;

    this.lotService
      .getByFilter(
        this.formFilter.controls['idFormula']?.value?.id || null,
        this.formFilter.controls['nroLote']?.value || null,
        dateT || null,
        dateF || null,
        estadoFind?.idEstado || null,
        999999,
        0,
        this.sort.active ? this.sort.active : 'nroLote',
        this.sort.direction === 'asc' ? true : false
      )
      .pipe(
        map((res: ILotsResponse) => res.data)
      )
      .subscribe({
        next: (value) => {
          const formattedData = this.formatDataForExport(value);
          this.procesarExportacion(tipo, formattedData);
          this.exporting = false;
        },
        error: (err) => {
          console.error('Error al cargar datos para exportar', err);
          this.exporting = false;
        }
      });
  }

  procesarExportacion(tipo: string, data: any[]): void {
    switch (tipo) {
      case 'csv':
        this.exportDataComponent.descargarCsv(data);
        break;
      case 'excel':
        this.exportDataComponent.descargarExcel(data);
        break;
      case 'pdf':
        this.exportDataComponent.descargarPdf(data);
        break;
      default:
        console.warn('Tipo de exportación no soportado:', tipo);
    }
  }

  formatDataForExport(data: ILot[]): any[] {
    return data.map((item) => ({
      'Estado': item['estado'],
      'Nro Lote': item.nroLote,
      'Formula': item.formula,
      'Fecha': item.fecha,
      'Observaciones': item.observaciones,
      'Fecha Estado': item.fechaEstado,
      'Observaciones Estado': item['observacionesEstado'],
    }));
  }

  public openGraphicModal(lote: ILot): void {
    const dialogRef = this.dialog.open(LotGraphicDialogComponent, {
      width: '840px',
      data: { lotId: lote.id, lotNroLote: lote.nroLote },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'upload') {
        this.forceSearch();
      }
    });
  }

  private _filter(value: string): IFormula[] {
    const filterValue = value.toLowerCase();
    return this.formulas.filter((formula: IFormula) =>
      formula.nombre.toLowerCase().includes(filterValue)
    );
  }

  private _approve(
    id: number,
    body: { estado: string; observaciones: string; fecha: string }
  ): void {
    const error: string = 'abm-lots => lots.component.ts => approve() =>';

    this.lotService.approve(id, body).subscribe({
      next: () => {
        this.openSnackBar(true, null);
        this.search();
      },
      error: (err: any) => {
        console.log(error, err);
        this.openSnackBar(false, null);
      },
    });
  }

  private _reject(id: number, observaciones: string, fecha: string): void {
    const error: string = 'abm-lots => lots.component.ts => reject() =>';

    this.lotService.reject(id, observaciones, fecha).subscribe({
      next: () => {
        this.openSnackBar(true, null);
        this.search();
      },
      error: (err: any) => {
        console.log(error, err);
        this.openSnackBar(false, null);
      },
    });
  }

 private async _dialog(lote: ILot, set: string): Promise<void> {
  try {
    // Esperamos la respuesta de hasEnsayos
    const res = await firstValueFrom(this.lotService.hasEnsayos(lote.id));
    const hasEnsayos: Boolean = res.data;

    if (!hasEnsayos) {
      this.openSnackBar(false, 'No se pueden aprobar/rechazar lotes sin ensayos.');
      return; // No abrimos el modal
    }

    // Abrimos el modal si tiene ensayos
    const dialogRef = this.dialog.open(LotDialogComponent, {
      width: 'fit-content',
      data: { set: set }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) return;

    const { status, observation, fecha } = result;

    if ((status === 'APROBADO' || status === 'APROBADO_OBSERVADO') && this.validarFechas(fecha, lote.fecha)) {
      await firstValueFrom(this.lotService.approve(lote.id, {
        estado: status,
        observaciones: observation,
        fecha: fecha
      }));
      this.openSnackBar(true);
      this.search();
    } else if (status === 'RECHAZADO' && this.validarFechas(fecha, lote.fecha)) {
      await firstValueFrom(this.lotService.reject(lote.id, observation, fecha));
      this.openSnackBar(true);
      this.search();
    } else {
      this.openSnackBar(false, 'La fecha seleccionada no puede ser anterior a la fecha de creación del lote.');
    }

  } catch (err) {
    console.error('Error en _dialog:', err);
    this.openSnackBar(false, 'No se pudieron realizar los cambios.');
  }
}


  private createFormulaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      if (typeof value === 'string') {
        return { invalidFormula: true };
      }
      if (value === 0) {
        return null;
      }
      if (value?.id) {
        return null;
      }
      return { invalidFormula: true };
    };
  }

  private setForm(): void {
    this.formFilter = this.formBuilder.group({
      nroLote: new FormControl('', [Validators.maxLength(5)]),
      fechaDesde: new FormControl(null),
      fechaHasta: new FormControl(null),
      idFormula: [null, [this.createFormulaValidator()]],
      estado: new FormControl(null),
    });
  }

  private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
    const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
    const defaultCss: string = option ? 'green' : 'red';
    const snackBarMessage = message ? message : defaultMessage;
    const snackBarCss = css ? css : defaultCss;
    const snackBarDuration = duration ? duration : 5000;

    this.snackBar.open(snackBarMessage, 'X', {
      duration: snackBarDuration,
      panelClass: `${snackBarCss}-snackbar`,
    });
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @HostListener('window:scroll', ['$event'])
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  onWindowScroll(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }
}
