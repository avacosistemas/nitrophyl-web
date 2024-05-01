import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { DateAdapter } from '@angular/material/core';
import { Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-lots',
  templateUrl: './lots.component.html',
})
export class LotsComponent implements OnInit, AfterViewInit, OnDestroy {

  public component: string = 'all';
  public drawer: boolean; // Drawer state.
  public lots$: Observable<ILot[]>; // Lotes.
  public formulas$: Observable<IFormula[]>; // Formulas.
  public panelOpenState: boolean;
  public formFilter: FormGroup;

  // * Form (create).
  public form: FormGroup = new FormGroup({
    lot: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(5),
      Validators.pattern(/^[A-Za-z]\d{4}$/),
    ]),
    date: new FormControl(new Date(), Validators.required),
    formula: new FormControl(null, Validators.required),
    observation: new FormControl(null, Validators.maxLength(255)),
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

  lots: ILot[];
  sortedData: ILot[];
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  dataSource = new MatTableDataSource<ILot>([]);
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;
  searching: boolean;


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

    this.lots$ = this.lotService
      .get()
      .pipe(map((res: ILotsResponse) => res.data));

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

    this.lotService.get().subscribe({
      next: (response) => {
        this.lots = response.data;
        this.sortedData = response.data;
        this.dataSource.data = response.data
      }
    })

  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }

  public get(row: ILot): void {
    this.assayService.lot = row;
    this.router.navigate([`../../ensayos/${row.id}`]);
  }

  public set(id: number, status: string): void {
    this._dialog(id, status);
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
    } = {
      idFormula: this.form.controls['formula'].value.id,
      nroLote: this.form.controls['lot'].value,
      observaciones: this.form.controls['observation'].value ?? '',
      fecha: date,
    };

    this._post(lot);
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
      next: () => {
        this._snackBar(true);
        this._reset();
        this.lots$ = this.lotService
          .get()
          .pipe(map((res: ILotsResponse) => res.data));
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false);
      },
    });
  }

  private _snackBar(option: boolean): void {
    const message: string = option
      ? 'Cambios realizados correctamente.'
      : 'No se han podido realizar los cambios.';
    const css: string = option ? 'green' : 'red';
    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }

  private _reset(): void {
    this.form.reset();
    this.lotService.toggleDrawer();
  }

  private _approve(
    id: number,
    body: { estado: string; observaciones: string }
  ): void {
    const error: string = 'abm-lots => lots.component.ts => approve() =>';

    this.lotService.approve(id, body).subscribe({
      next: () => {
        this._snackBar(true);
        this.lots$ = this.lotService
          .get()
          .pipe(map((res: ILotsResponse) => res.data));
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false);
      },
    });
  }

  private _reject(id: number, observations: string): void {
    const error: string = 'abm-lots => lots.component.ts => reject() =>';

    this.lotService.reject(id, observations).subscribe({
      next: () => {
        this._snackBar(true);
        this.lots$ = this.lotService
          .get()
          .pipe(map((res: ILotsResponse) => res.data));
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false);
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

    this.lots$ = this.lotService
      .getByFilter(this.formFilter.controls['idFormula'].value != null ? this.formFilter.controls['idFormula'].value.id : null,
        this.formFilter.controls['nroLote'].value,
        dateT,
        dateF)
      .pipe(map((res: ILotsResponse) => res.data));
  }

  private _dialog(id: number, set: string): void {
    const dialogRef = this.dialog.open(LotDialogComponent, {
      width: 'fit-content',
      data: { set: set },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { status: string; observation: string }) => {
        if (result) {
          if (
            result.status === 'APROBADO' ||
            result.status === 'APROBADO_OBSERVADO'
          ) {
            this._approve(id, {
              estado: result.status,
              observaciones: result.observation,
            });
          }
          if (result.status === 'RECHAZADO') {
            this._reject(id, result.observation);
          }
        }
      });
  }

  private setForm(): void {
    this.formFilter = this.formBuilder.group({
      nroLote: new FormControl('', [
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern(/^[A-Za-z]\d{4}$/),
      ]),
      fechaDesde: new FormControl(null),
      fechaHasta: new FormControl(null),
      idFormula: new FormControl(null)
    });
  }

  sortData(sort: Sort) {
    const data = this.lots.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'fechaEstado':
          return this.compare(a.fechaEstado, b.fechaEstado, isAsc);
        case 'nroLote':
          return this.compare(a.nroLote, b.nroLote, isAsc);
        case 'formula':
          return this.compare(a.formula, b.formula, isAsc);
        case 'fecha':
          return this.compare(a.fecha, b.fecha, isAsc);
        case 'observaciones':
          return this.compare(a.observaciones, b.observaciones, isAsc);
        case 'estado':
          return this.compare(a.observaciones, b.observaciones, isAsc);
        default:
          return 0;
      }
    });
  }
  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }



  getPagedData() {
    const search = {
      // ... set filters here
    };

    this.dataSource.data = this.lots.slice(this.pageIndex * this.pageSize, (this.pageIndex * this.pageSize) + this.pageSize);
    this.totalRecords = this.lots.length

    //this.searching = true;
    /*this.service.search(search).subscribe({
      next: ((results) => {
        this.totalRecords = results?.length ? results[0].totalRecords : 0;
        this.dataSource.data = results || [];
      }),
      complete: () => this.searching = false,
      error: () => this.searching = false,
    });*/
  }


  pageChangeEvent(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getPagedData();
  }

  limpiar() {
    this.formFilter.reset();
  }

}

