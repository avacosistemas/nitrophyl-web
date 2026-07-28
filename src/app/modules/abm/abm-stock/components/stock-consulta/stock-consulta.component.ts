import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, of, Observable } from 'rxjs';
import { startWith, switchMap, map, catchError, takeUntil } from 'rxjs/operators';
import { StockService } from '../../stock.service';
import { IStockPieza } from '../../models/stock.model';
import { FormulasService } from 'app/modules/abm/abm-formula/formulas.service';
import { IFormula } from 'app/modules/abm/abm-formula/formula.interface';
import { NotificationService } from 'app/shared/services/notification.service';

@Component({
  selector: 'app-stock-consulta',
  templateUrl: './stock-consulta.component.html',
  styleUrls: ['./stock-consulta.component.scss'],
})
export class StockConsultaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  private _destroying$ = new Subject<void>();

  isLoading = true;
  dataSource = new MatTableDataSource<IStockPieza>([]);
  displayedColumns: string[] = [
    'fechaActualizacion',
    'codigo',
    'denominacion',
    'tipo',
    'material',
    'formula',
    'stockFisico',
    'stockReservado',
    'acciones',
  ];
  totalReg = 0;

  searchForm: FormGroup;
  formulas: IFormula[] = [];
  filteredFormulas$?: Observable<IFormula[]>;

  breadcrumbs = [
    { title: 'Producción', route: [], condition: true },
    { title: 'Stock', route: [], condition: true },
    { title: 'Consulta', route: ['/stock/consulta'], condition: true },
  ];

  constructor(
    private _fb: FormBuilder,
    private _router: Router,
    private _stockService: StockService,
    private _formulasService: FormulasService,
    private _notificationService: NotificationService
  ) {
    this.searchForm = this._fb.group({
      codigo: [''],
      denominacion: [''],
      formula: [null],
    });
  }

  private searchSubject = new Subject<void>();

  ngOnInit(): void {
    this.loadFormulas();
  }

  ngAfterViewInit(): void {
    merge(this.sort.sortChange, this.paginator.page, this.searchSubject)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          const params = this.buildRequestParams();
          return this._stockService.getPiezaStock(params).pipe(
            catchError((err) => {
              this._notificationService.showError('Error al cargar la consulta de stock.');
              return of(null);
            })
          );
        }),
        map((response) => {
          this.isLoading = false;
          if (response && response.data) {
            this.totalReg = response.data.totalReg || response.data.page?.length || 0;
            return response.data.page || [];
          }
          return [];
        }),
        takeUntil(this._destroying$)
      )
      .subscribe((data) => {
        this.dataSource.data = data;
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
  }

  loadFormulas(): void {
    this._formulasService
      .get()
      .pipe(takeUntil(this._destroying$))
      .subscribe({
        next: (res: any) => {
          this.formulas = res?.data || [];
          this.filteredFormulas$ = this.searchForm.get('formula').valueChanges.pipe(
            startWith(''),
            map((value) => {
              const name = typeof value === 'string' ? value : value?.nombre || '';
              return name ? this._filterFormulas(name) : this.formulas.slice();
            })
          );
        },
        error: () => {
          this._notificationService.showError('Error al cargar la lista de fórmulas.');
        },
      });
  }

  private _filterFormulas(value: string): IFormula[] {
    const filterValue = value.toLowerCase();
    return this.formulas.filter(
      (f) =>
        (f.nombre && f.nombre.toLowerCase().includes(filterValue)) ||
        (f.norma && f.norma.toLowerCase().includes(filterValue))
    );
  }

  displayFormulaFn(formula: IFormula): string {
    if (!formula) return '';
    return formula.nombre ? `${formula.nombre}${formula.version ? ' V' + formula.version : ''}` : '';
  }

  clearFormulaInput(): void {
    this.searchForm.get('formula').setValue(null);
  }

  search(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.searchSubject.next();
  }

  limpiarFiltros(): void {
    this.searchForm.reset({
      codigo: '',
      denominacion: '',
      formula: null,
    });
    this.search();
  }

  verMovimientos(element: IStockPieza): void {
    this._router.navigate(['/stock/movimientos'], {
      queryParams: {
        idPieza: element.id,
        piezaNombre: element.denominacion,
      },
    });
  }

  private buildRequestParams(): any {
    const formValues = this.searchForm.value;
    const formulaVal = formValues.formula;
    let idFormula: number | null = null;
    if (typeof formulaVal === 'object' && formulaVal !== null) {
      idFormula = formulaVal.id;
    } else if (typeof formulaVal === 'number') {
      idFormula = formulaVal;
    }

    return {
      asc: true,
      codigo: formValues.codigo || null,
      denominacion: formValues.denominacion || null,
      idFormula: idFormula,
    };
  }
}
