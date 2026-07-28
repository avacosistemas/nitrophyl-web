import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, of, Observable } from 'rxjs';
import { startWith, switchMap, map, catchError, takeUntil, debounceTime } from 'rxjs/operators';
import { StockService } from '../../stock.service';
import { IStockMovimiento } from '../../models/stock.model';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { NotificationService } from 'app/shared/services/notification.service';
import moment from 'moment';

@Component({
  selector: 'app-stock-movimientos',
  templateUrl: './stock-movimientos.component.html',
  styleUrls: ['./stock-movimientos.component.scss'],
})
export class StockMovimientosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  private _destroying$ = new Subject<void>();

  isLoading = true;
  dataSource = new MatTableDataSource<IStockMovimiento>([]);
  displayedColumns: string[] = ['fecha', 'piezaNombre', 'cantidad', 'observacion', 'origen'];
  totalReg = 0;

  searchForm: FormGroup;
  filteredPiezas$?: Observable<any[]>;

  breadcrumbs = [
    { title: 'Producción', route: [], condition: true },
    { title: 'Stock', route: [], condition: true },
    { title: 'Movimientos', route: ['/stock/movimientos'], condition: true },
  ];

  constructor(
    private _fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _stockService: StockService,
    private _abmPiezasService: ABMPiezaService,
    private _notificationService: NotificationService
  ) {
    this.searchForm = this._fb.group({
      fechaDesde: [null],
      fechaHasta: [null],
      pieza: [null],
    });
  }

  ngOnInit(): void {
    this.setupPiezasAutocomplete();

    this._route.queryParams.pipe(takeUntil(this._destroying$)).subscribe((params) => {
      if (params['idPieza']) {
        const idPieza = Number(params['idPieza']);
        const piezaNombre = params['piezaNombre'] || `Pieza ID #${idPieza}`;
        this.searchForm.get('pieza')?.setValue({
          id: idPieza,
          denominacion: piezaNombre,
        });
      }
    });
  }

  private searchSubject = new Subject<void>();

  ngAfterViewInit(): void {
    merge(this.sort.sortChange, this.paginator.page, this.searchSubject)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          const params = this.buildRequestParams();
          return this._stockService.getStockMovimientos(params).pipe(
            catchError((err) => {
              this._notificationService.showError('Error al cargar movimientos de stock.');
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

  setupPiezasAutocomplete(): void {
    this.filteredPiezas$ = this.searchForm.get('pieza').valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        const searchTerm = typeof value === 'string' ? value : value?.nombre || value?.denominacion || '';
        if (typeof value === 'object' && value !== null) {
          return of([]);
        }
        return this._abmPiezasService.getPiezasCombo(searchTerm).pipe(
          map((res) => res.data || []),
          catchError(() => of([]))
        );
      })
    );
  }

  displayPiezaFn(pieza: any): string {
    if (!pieza) return '';
    return pieza.denominacion || pieza.nombre || '';
  }

  clearPiezaInput(): void {
    this.searchForm.get('pieza').setValue(null);
  }

  formatOrigen(origen: string): string {
    if (!origen) return '';
    return origen.replace(/_/g, ' ');
  }

  search(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.searchSubject.next();
  }

  limpiarFiltros(): void {
    this.searchForm.reset({
      fechaDesde: null,
      fechaHasta: null,
      pieza: null,
    });
    this.search();
  }

  private buildRequestParams(): any {
    const formValues = this.searchForm.value;

    let idPiezaSelected: number | null = null;
    const piezaVal = formValues.pieza;
    if (typeof piezaVal === 'object' && piezaVal !== null) {
      idPiezaSelected = piezaVal.id;
    } else if (typeof piezaVal === 'number') {
      idPiezaSelected = piezaVal;
    }

    const fechaDesdeStr = formValues.fechaDesde ? moment(formValues.fechaDesde).format('DD/MM/YYYY') : null;
    const fechaHastaStr = formValues.fechaHasta ? moment(formValues.fechaHasta).format('DD/MM/YYYY') : null;

    return {
      asc: true,
      fechaDesde: fechaDesdeStr,
      fechaHasta: fechaHastaStr,
      idPieza: idPiezaSelected,
    };
  }
}
