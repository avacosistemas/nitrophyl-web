import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith, Subscription } from 'rxjs';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';
import { FormulasService } from 'app/shared/services/formulas.service';
import { LotService } from 'app/shared/services/lot.service';

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
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
import moment from 'moment';
import { MatSort, MatSortable, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IResponse } from 'app/shared/models/response.interface';
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';

export interface Estado {
  idEstado: string,
  value: string
}

@Component({
  selector: 'app-lots',
  templateUrl: './lots.component.html',
  styleUrls: ['./lots.component.css'],
  providers: [// The locale would typically be provided on the root module of your application. We do it at
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
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },],
})
export class LotsComponent implements OnInit, AfterViewInit, OnDestroy {

  public component: string = 'all';
  public drawer: boolean; // Drawer state.
  public drawerEdit: boolean; // Drawer state.
  public lots$: Observable<ILot[]>; // Lotes.
  public formulas$: Observable<IFormula[]>; // Formulas.
  public panelOpenState: boolean;
  public formFilter: FormGroup;

  // * Form (create).
  public form: FormGroup = new FormGroup({
    lot: new FormControl('', [
      Validators.required,
      Validators.maxLength(5),
    ]),
    date: new FormControl(new Date(), Validators.required),
    formula: new FormControl(null, Validators.required),
    observation: new FormControl(null, Validators.maxLength(255)),
    id: new FormControl(0),
  });

  public formulas: IFormula[]; // AutoComplete.

  // * Table.
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

  private subscription: Subscription; // Drawer subscription.
  private subscriptionEdit: Subscription; // Drawer subscription.

  lots: ILot[];
  sortedData: ILot[];
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  dataSource = new MatTableDataSource<ILot>([]);
  totalRecords = 0;
  pageSize = 5;
  pageIndex = 0;
  searching: boolean;
  estados: Estado[] = [{ idEstado: "PENDIENTE_APROBACION", value: "Pendiente Aprobación" },
  { idEstado: "RECHAZADO", value: "Rechazado" },
  { idEstado: "APROBADO", value: "Aprobado" },
  { idEstado: "APROBADO_OBSERVADO", value: "Aprobado con observaciones" }]
  @ViewChild(MatSort, { static: true }) sort: MatSort;

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
  ) { this.dateAdapter.setLocale('es'); }

  public ngOnInit(): void {
    this.setForm();

    // this.lots$ = this.lotService
    //   .get()
    //   .pipe(map((res: ILotsResponse) => res.data));

    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
        this.formulas$ = this.form.controls['formula'].valueChanges.pipe(
          startWith(''),
          map((value: IFormula) =>
            typeof value === 'string' ? value : value?.nombre
          ),
          map((name: string) =>
            name ? this._filter(name) : this.formulas.slice()
          )
        );
      });

    this.subscription = this.lotService.drawer$.subscribe((drawer: boolean) => {
      this.drawer = drawer;
    });
    
    this.subscriptionEdit = this.lotService.drawerEdit$.subscribe((drawer: boolean) => {
      this.drawerEdit = drawer;
    });
    
    let estadoFind = this.estados.find((value) => {
      if (value.value == this.formFilter.controls['estado'].value) return true;
      return false;
    });

    this.lots$ = this.lotService
      .getByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        null,
        null,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, "nroLote", true)
      .pipe(map((res: ILotsResponse) => res.data));
    this.lots$.subscribe(value => {
      this.dataSource = new MatTableDataSource<ILot>(value);
    });

    let lotsCount$ = this.lotService
      .countByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        null,
        null,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, "nroLote", true)
      .pipe(map((res: IResponse<number>) => res.data));
    lotsCount$.subscribe(value => this.totalRecords = value);
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }

    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.sort.sort(({ id: 'nroLote', start: 'desc'}) as MatSortable);
    this.dataSource.sort = this.sort;
  }

  public displayFn(formula: IFormula): string {
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

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const date: string = this._dPipe.transform(
      this.form.controls['date'].value,
      'dd/MM/yyyy'
    );

    const lot: {
      idFormula: number;
      nroLote: string;
      observaciones: string;
      fecha: string;
      revision: number;
    } = {
      idFormula: this.form.controls['formula'].value.id,
      nroLote: this.form.controls['lot'].value,
      observaciones: this.form.controls['observation'].value ?? '',
      fecha: date,
      revision: 0
    };

    this._post(lot);
  }

  public edit(idLote: number) {
    this.lotService.read(idLote).subscribe({
      next: (value: IResponse<ILot>) => {
        let data: any = value.data
        let data2: IResponse<ILot> = value
        this.form.controls['observation'].setValue(data.body.data.observaciones)
        let dateString = data.body.data.fecha
        let dateParts = dateString.split("/");
        let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        this.form.controls['date'].patchValue(dateObject)
        this.form.controls['formula'].patchValue(this.formulas.find(arg => arg.id == data.body.data.idFormula))
        this.form.controls['lot'].setValue(data.body.data.nroLote)
        this.form.controls['id'].setValue(data.body.data.id)
        this.lotService.toggleDrawerEdit();
      },
    });
  }




  public onEdit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }


    const date: string = this._dPipe.transform(
      this.form.controls['date'].value,
      'dd/MM/yyyy'
    );

    const lot: {
      idFormula: number;
      nroLote: string;
      observaciones: string;
      fecha: string;
      id: number;
      revision: number;
    } = {
      idFormula: this.form.controls['formula'].value.id,
      nroLote: this.form.controls['lot'].value,
      observaciones: this.form.controls['observation'].value ?? '',
      fecha: date,
      id: this.form.controls['id'].value,
      revision: 0
    };

    this._put(lot);
    

  }

  public closeEdit(): void {
    if (!this.form.pristine) {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: '', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) {
          this._resetEdit();
        }
      });
    } else {
      this._resetEdit();
    }
  }

  public close(): void {
    if (!this.form.pristine) {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: '', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) {
          this._reset();
        }
      });
    } else {
      this._reset();
    }
  }

  public ngOnDestroy(): void {
    this.form.reset();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private _filter(name: string): IFormula[] {
    return this.formulas.filter(
      (formula: IFormula) =>
        formula.nombre.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  private _post(lot: ILot): void {
    const error: string = 'abm-lots => lots.component.ts => _post() =>';

    this.lotService.post(lot).subscribe({
      next: (value:IResponse<ILot>) => {
        if (value.status != "OK") {
            this._snackBar(false, value.error);  
            //this.lotService.toggleDrawer();
        } else {
          this._snackBar(true, null);
          this._reset();
          // this.lots$ = this.lotService
          //   .get()
          //   .pipe(map((res: ILotsResponse) => res.data));
          this.search();
        }
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false, null);
      },
    });
  }

  private _put(lot: ILot): void {
    const error: string = 'abm-lots => lots.component.ts => _put() =>';

    this.lotService.put(lot).subscribe({
      next: (value:IResponse<ILot>) => {
        if (value.status != "OK") {
          this._snackBar(false, value.error);  
          //this.lotService.toggleDrawerEdit();
        } else {
          this._snackBar(true, null);
          
          this.lots$ = this.lotService
            .get()
            .pipe(map((res: ILotsResponse) => res.data));
            this.lotService.toggleDrawerEdit();
            this.search();
        }
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false, err);
      },
    });
  }


  private _snackBar(option: boolean, errorMsg:string): void {
    const message: string = option
      ? 'Cambios realizados correctamente.'
      : errorMsg == null ? 'No se han podido realizar los cambios.': errorMsg;
    const css: string = option ? 'green' : 'red';
    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }

  private _resetEdit(): void {
    this.form.reset();
    this.lotService.toggleDrawerEdit();
  }

  private _reset(): void {
    this.form.reset();
    this.lotService.toggleDrawer();
  }

  private _approve(
    id: number,
    body: { estado: string; observaciones: string, fecha: string }
  ): void {
    const error: string = 'abm-lots => lots.component.ts => approve() =>';

    this.lotService.approve(id, body).subscribe({
      next: () => {
        this._snackBar(true, null);
        this.search();
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false, null);
      },
    });
  }

  private _reject(id: number, observations: string, fecha: string): void {
    const error: string = 'abm-lots => lots.component.ts => reject() =>';

    this.lotService.reject(id, observations, fecha).subscribe({
      next: () => {
        this._snackBar(true, null);
        this.search();
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false, null);
      },
    });
  }

  search() {
    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde'].value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta'].value,
      'dd/MM/yyyy'
    );

    let estadoFind = this.estados.find((value) => {
      if (value.value == this.formFilter.controls['estado'].value) return true;
      return false;
    }
    )
    this.pageIndex = 0;

    this.lots$ = this.lotService
      .getByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, this.sort.active ? this.sort.active : "nroLote", this.sort.direction == 'asc' ? true : false)
      .pipe(map((res: ILotsResponse) => res.data));

    this.lots$.subscribe({
      next: (value) => {
        this.dataSource = new MatTableDataSource<ILot>(value);
      }
    })
  }

  private _dialog(lote: ILot, set: string): void {    
    const dialogRef = this.dialog.open(LotDialogComponent, {
      width: 'fit-content',
      data: { set: set },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { status: string; observation: string; fecha: string }) => {
        if (result) {
          if ( result.status === 'APROBADO' || result.status === 'APROBADO_OBSERVADO') {
            if (this.validarFechas(result.fecha, lote.fecha)) {
              this._approve(lote.id, {
                estado: result.status,
                observaciones: result.observation,
                  fecha: result.fecha
              });
              this._snackBar(true, null);
            } else {
              this._snackBar(false, "La fecha de aprobación no puede ser anterior a la de creación del lote.");
            }
          }
          if (result.status === 'RECHAZADO') {
            if (this.validarFechas(result.fecha, lote.fecha)) {
              this._reject(lote.id, result.observation, result.fecha);
            } else {
              this._snackBar(false, "La fecha de rechazo no puede ser anterior a la de creación del lote.");
            }
          }
        }
      });
      

  }

  validarFechas(fechaAprobacion: string, loteFecha: string) {
    if (fechaAprobacion == null) {
      return false;
    }
    let fechaAprobacionDate: Date = new Date(fechaAprobacion);
    let inputDate = new Date(fechaAprobacionDate.toDateString())

    let dateMomentObject = moment(loteFecha, "DD/MM/YYYY");
    let dateObject = dateMomentObject.toDate()
    const strFechaCreacion: string = this._dPipe.transform(
      dateObject,
      'dd/MM/yyyy'
    );
    const strFechaAprobacion: string = this._dPipe.transform(
      inputDate,
      'dd/MM/yyyy'
    );
    if (strFechaAprobacion < strFechaCreacion ) {
      // || strFechaAprobacion == strFechaCreacion
      return false
    }
    return true;
  }

  private setForm(): void {
    this.formFilter = this.formBuilder.group({
      nroLote: new FormControl('', [
        Validators.maxLength(5),
      ]),
      fechaDesde: new FormControl(null),
      fechaHasta: new FormControl(null),
      idFormula: new FormControl(null),
      estado: new FormControl(null)
    });
  }

  @HostListener("window:scroll", ["$event"])
  onWindowScroll(event) {
    // prevent the background from scrolling when the dialog is open.
    event.stopPropagation();
  }

  sortData(sort: Sort) {

    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde'].value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta'].value,
      'dd/MM/yyyy'
    );

    let estadoFind = this.estados.find((value) => {
      if (value.value == this.formFilter.controls['estado'].value) return true;
      return false;
    })

    this.lots$ = this.lotService
      .getByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, sort.active, sort.direction == 'asc' ? true : false)
      .pipe(map((res: ILotsResponse) => res.data));

    this.lots$.subscribe({
      next: (value) => {
        this.dataSource = new MatTableDataSource<ILot>(value);
      }
    });


    let lotsCount$ = this.lotService
      .countByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, sort.active, sort.direction == 'asc' ? true : false)
      .pipe(map((res: IResponse<number>) => res.data));
    lotsCount$.subscribe(value => {
      this.totalRecords = value;
    })

  }




  getPagedData() {
    const dateT: string = this._dPipe.transform(
      this.formFilter.controls['fechaDesde'].value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.formFilter.controls['fechaHasta'].value,
      'dd/MM/yyyy'
    );

    let estadoFind = this.estados.find((value) => {
      if (value.value == this.formFilter.controls['estado'].value) return true;
      return false;
    })

    let lotsCount$ = this.lotService
      .countByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, this.sort.active ? this.sort.active : "nroLote", this.sort.direction == 'asc' ? true : false)
      .pipe(map((res: IResponse<number>) => res.data));
    lotsCount$.subscribe(value => {
      this.totalRecords = value;
    })

    this.lots$ = this.lotService
      .getByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF,
        estadoFind != null ? estadoFind.idEstado : null, this.pageSize, this.pageIndex, this.sort.active ? this.sort.active : "nroLote", this.sort.direction == 'asc' ? true : false)
      .pipe(map((res: ILotsResponse) => res.data));
    this.lots$.subscribe(value => {
      this.dataSource = new MatTableDataSource<ILot>(value);
    });




  }


  pageChangeEvent(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getPagedData();
  }

  limpiar() {
    this.formFilter.reset();
    this.estados = [{ idEstado: "PENDIENTE_APROBACION", value: "Pendiente Aprobación" },
    { idEstado: "RECHAZADO", value: "Rechazado" },
    { idEstado: "APROBADO", value: "Aprobado" },
    { idEstado: "APROBADO_OBSERVADO", value: "Aprobado con observaciones" }]
  }



  private delete(lote: ILot): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '40%',
      data: { data: lote.nroLote, seccion: "lote", boton: "Eliminar" },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.lotService.delete(lote.id).subscribe(response => {
          if (response.status == 'OK') {
            this.lots$ = this.lotService
              .get()
              .pipe(map((res: ILotsResponse) => res.data));
            this._snackBar(true, null);
            this.search();
          } else {
            this._snackBar(false, response.error);
          }
        })
      }
    });
  }
}
