import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith, Subscription } from 'rxjs';

// * Services.
import { LotService } from 'app/shared/services/lot.service';

// * Interfaces.
import { ILot, ILotsResponse } from 'app/shared/models/lot.interface';

// * Material.
import { MatSnackBar } from '@angular/material/snack-bar';

// * Dialogs.
import { DatePipe } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { IFormula, IFormulaResponse, IFormulasResponse } from 'app/shared/models/formula.interface';
import { FormulasService } from 'app/shared/services/formulas.service';
import * as moment from 'moment';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation/vertical/vertical.component';
import { FuseNavigationService } from '@fuse/components/navigation';
import { ClassyLayoutComponent } from 'app/layout/layouts/vertical/classy/classy.component';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { IResponse } from 'app/shared/models/response.interface';

@Component({
  selector: 'app-lots',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss'],
})
export class MonitorComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public drawer: boolean; // Drawer state.
  public lots$: ILot[] | undefined; // Lotes..
  private lotsBackUp$: ILot[] = [];
  public panelOpenState: boolean = false;
  public lotsFail: boolean = false;
  public formulas$: Observable<IFormula[]>; // Formulas.
  public formulas: IFormula[]; // AutoComplete.

  // * Form (create).
  public form: FormGroup = new FormGroup({
    nroLote: new FormControl('', [
      Validators.maxLength(5)
    ]),
    fechaDesde: new FormControl(null),
    fechaHasta: new FormControl(null),
    idFormula: new FormControl(null)
  });

  // * Table.
  public displayedColumns: string[] = [
    'estado',
    'nroLote',
    'formula',
    'fechaEstado',
/*    'observaciones',
    'fechaEstado',
    'observacionesEstado',
    'actions',*/
  ];

  private subscription: Subscription; // Drawer subscription.

  // MatPaginator Inputs
  length = 100;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];

  // MatPaginator Output
  pageEvent: PageEvent;
  pageIndex: number = 0;
  totalRecords: number;

  setPageSizeOptions(setPageSizeOptionsInput: string) {
    if (setPageSizeOptionsInput) {
      this.pageSizeOptions = setPageSizeOptionsInput.split(',').map(str => +str);
    }
  }
  dataSource = new MatTableDataSource<ILot>([]);
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private lotService: LotService,
    private router: Router,
    private snackBar: MatSnackBar,
    private _dPipe: DatePipe,
    private formulaService: FormulasService,
    private dateAdapter: DateAdapter<Date>,
    private _fuseNavigationService: FuseNavigationService
  ) { this.dateAdapter.setLocale('es');}

  pageChangeEvent(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getPagedData();
  }
  
  getPagedData() {
    const dateT: string = this._dPipe.transform(
      this.form.controls['fechaDesde'].value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.form.controls['fechaHasta'].value,
      'dd/MM/yyyy'
    );

    this.lotService
      .countByFilterMonitor(this.form.controls['idFormula'].value != null ? this.form.controls['idFormula'].value.id : null,
        this.form.controls['nroLote'].value,
        dateT,
        dateF,
        this.pageSize, this.pageIndex, this.sort.active ? this.sort.active : "nroLote", this.sort.direction == 'asc' ? true : false)
      .pipe(map((res: IResponse<number>) => res.data)).subscribe(value => {
      this.totalRecords = value;
    })

    this.lotService
      .getByFilterMonitor(this.form.controls['idFormula'].value != null ? this.form.controls['idFormula'].value.id : null,
        this.form.controls['nroLote'].value,
        dateT,
        dateF,
        this.pageSize, this.pageIndex, this.sort.active ? this.sort.active : "nroLote", this.sort.direction == 'asc' ? true : false)
      .pipe(map((res: ILotsResponse) => res.data)).subscribe(value => {
      this.dataSource = new MatTableDataSource<ILot>(value);
    });

  }

  private get(): void {
    let error: string = 'MonitorComponent => get(): ';
    this.lotService.getMonitor().subscribe({
      next: (res: ILotsResponse) => {
        this.lots$ = res.data;
        this.lotsBackUp$ = res.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }


  public ngOnInit(): void {
    const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

     if (navigation) {
       navigation.close();
    }
    
    this.get();

    this.subscription = this.lotService.drawer$.subscribe((drawer: boolean) => {
      this.drawer = drawer;
    });

    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
        this.formulas$ = this.form.controls['idFormula'].valueChanges.pipe(
          startWith(''),
          map((value: IFormula) =>
            typeof value === 'string' ? value : value?.nombre
          ),
          map((name: string) =>
            name ? this._filter(name) : this.formulas.slice()
          )
        );
      });
  }

  private _filter(name: string): IFormula[] {
    return this.formulas.filter(
      (formula: IFormula) =>
        formula.nombre.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public ngOnDestroy(): void {
    this.form.reset();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }
  
  public search(): void {
    this.pageIndex = 0;

    this.lotService.getByFilterMonitor(this.form.controls.idFormula.value ? this.form.controls.idFormula.value.id : null,
      this.form.controls.nroLote.value,
      this.form.controls.fechaDesde.value ? moment(this.form.controls.fechaDesde.value).format("DD/MM/YYYY") : null,
      this.form.controls.fechaHasta.value ? moment(this.form.controls.fechaHasta.value).format("DD/MM/YYYY") : null,
      this.pageSize, this.pageIndex, "nroLote", true).subscribe({
        next: (res: ILotsResponse) => {
          this.dataSource = new MatTableDataSource<ILot>(res.data);
          this.lots$ = res.data;
          this.lotsBackUp$ = res.data;
        },
        error: (err: any) => console.error(err),
        complete: () => { },
      });

    let lotsCount$ = this.lotService
      .countByFilterMonitor(this.form.controls.idFormula.value ? this.form.controls.idFormula.value.id : null,
        this.form.controls.nroLote.value,
        this.form.controls.fechaDesde.value ? moment(this.form.controls.fechaDesde.value).format("DD/MM/YYYY") : null,
        this.form.controls.fechaHasta.value ? moment(this.form.controls.fechaHasta.value).format("DD/MM/YYYY") : null, this.pageSize, this.pageIndex, "nroLote", true)
      .pipe(map((res: IResponse<number>) => res.data));
    lotsCount$.subscribe(value => {
      this.length = value;
    })
    /*
    if (!this.form.controls.nroLote.value && !this.form.controls.idFormula.value &&
      !this.form.controls.fechaDesde.value && !this.form.controls.fechaHasta.value)
      this.lots$ = this.lotsBackUp$;

    if (this.form.controls.nroLote.value && this.form.controls.idFormula.value &&
        this.form.controls.fechaDesde.value && this.form.controls.fechaHasta.value)
      this.compare();
      
    if (this.form.controls.nroLote.value && !this.form.controls.idFormula.value &&
        !this.form.controls.fechaDesde.value && !this.form.controls.fechaHasta.value)
      this.compareLote();
            
    if (!this.form.controls.nroLote.value && this.form.controls.idFormula.value &&
        !this.form.controls.fechaDesde.value && !this.form.controls.fechaHasta.value)
      this.compareFormula();
                  
    if (!this.form.controls.nroLote.value && !this.form.controls.idFormula.value &&
       this.form.controls.fechaDesde.value && this.form.controls.fechaHasta.value)
      this.compareFecha();
      */
  }
  
  private compare(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) =>
      lot.nroLote === this.form.controls.nroLote.value &&
      lot.idFormula === this.form.controls.idFormula.value &&
      lot.fecha >= this.form.controls.fechaDesde.value &&
      lot.fecha <= this.form.controls.fechaHasta.value
    );
  }
    
  private compareLote(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) =>
      lot.nroLote === this.form.controls.nroLote.value
    );
  }
    
  private compareFormula(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) =>
      lot.idFormula === this.form.controls.idFormula.value.id
    );
  }
    
  private compareFecha(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) => {
        var date2 = moment(lot.fecha,'DD/MM/YYYY');
        return date2 >= this.form.controls.fechaDesde.value &&
               date2 <= this.form.controls.fechaHasta.value
      }
    );
  }

  sortData(sort: Sort) {

    const dateT: string = this._dPipe.transform(
      this.form.controls['fechaDesde'].value,
      'dd/MM/yyyy'
    );

    const dateF: string = this._dPipe.transform(
      this.form.controls['fechaHasta'].value,
      'dd/MM/yyyy'
    );

    this.lotService
      .getByFilterMonitor(this.form.controls['idFormula'].value != null ? this.form.controls['idFormula'].value.id : null,
        this.form.controls['nroLote'].value,
        dateT,
        dateF,
       this.pageSize, this.pageIndex, sort.active, sort.direction == 'asc' ? true : false)
      .pipe(map((res: ILotsResponse) => res.data)).subscribe({
      next: (value) => {
        this.dataSource = new MatTableDataSource<ILot>(value);
      }
    });


    this.lotService
      .countByFilterMonitor(this.form.controls['idFormula'].value != null ? this.form.controls['idFormula'].value.id : null,
        this.form.controls['nroLote'].value,
        dateT,
        dateF,
         this.pageSize, this.pageIndex, sort.active, sort.direction == 'asc' ? true : false)
      .pipe(map((res: IResponse<number>) => res.data)).subscribe(value => {
      this.totalRecords = value;
    })

  }
}
