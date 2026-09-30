import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject, merge, of } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil, tap, debounceTime } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { LotService } from 'app/modules/abm/abm-lots/lot.service';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { FormulasService } from 'app/modules/abm/abm-formula/formulas.service';
import { IRegistroEnvio } from 'app/modules/abm/abm-lots/lot.interface';
import { IFormula, IFormulaResponse, IFormulasResponse } from 'app/modules/abm/abm-formula/formula.interface';
import { Cliente, ResponseClientes } from 'app/modules/abm/abm-clientes/cliente.model';
import { TableDataService } from 'app/shared/services/table-data.service';

@Component({
  selector: 'app-registro-envios',
  templateUrl: './registro-envios.component.html',
  styleUrls: ['./registro-envios.component.scss']
})
export class RegistroEnviosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('clientInput') clientInput: ElementRef<HTMLInputElement>;
  @ViewChild('formulaInput') formulaInput: ElementRef<HTMLInputElement>;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<IRegistroEnvio>([]);
  displayedColumns: string[] = [
    'usuario',
    'fecha',
    'cliente',
    'lote',
    'formula',
    'email',
    'observacionesMail',
    'observacionesInforme'
  ];

  isLoading = false;
  totalReg = 0;
  pageSize = 10;
  panelOpenState = true;

  filteredClients$: Observable<Cliente[]>;
  filteredFormulas$: Observable<IFormula[]>;

  private allClients: Cliente[] = [];
  private allFormulas: IFormula[] = [];
  private _destroying$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private lotService: LotService,
    private clientsService: ClientesService,
    private formulasService: FormulasService,
    private datePipe: DatePipe,
    private tableDataService: TableDataService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchForm = this.fb.group({
      fechaDesde: [null],
      fechaHasta: [null],
      cliente: [null],
      formula: [null],
      nroLote: [''],
      email: ['']
    });
  }

  ngOnInit(): void {
    this.loadAutocompleteData();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          this.cdr.detectChanges();
          return this.loadDataObservable();
        }),
        map(data => {
          this.isLoading = false;
          return data;
        }),
        catchError(() => {
          this.isLoading = false;
          return of([]);
        }),
        takeUntil(this._destroying$)
      ).subscribe(data => {
        this.dataSource.data = data;
        this.cdr.detectChanges();
      });
  }

  formatFecha(fecha: any): string {
    if (!fecha) {
      return '-';
    }
    if (typeof fecha === 'string') {
      const trimmed = fecha.trim();
      const m = moment(trimmed, ['DD/MM/YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm', 'DD/MM/YYYY', moment.ISO_8601], true);
      if (m.isValid()) {
        if (trimmed.includes(':')) {
          return m.format('DD/MM/YYYY HH:mm');
        }
        return m.format('DD/MM/YYYY');
      }
      return trimmed;
    }
    const m = moment(fecha);
    if (m.isValid()) {
      return m.format('DD/MM/YYYY HH:mm');
    }
    return String(fecha);
  }

  ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
  }

  loadAutocompleteData(): void {
    this.clientsService.getClientes().subscribe({
      next: (res: ResponseClientes) => {
        this.allClients = res.data || [];
        this.filteredClients$ = this.searchForm.get('cliente').valueChanges.pipe(
          startWith(''),
          map(value => this._filterClients(value))
        );
      }
    });

    this.formulasService.get().pipe(
      map((res: IFormulasResponse | IFormulaResponse) => Array.isArray(res.data) ? res.data : [res.data])
    ).subscribe({
      next: (formulas: IFormula[]) => {
        this.allFormulas = formulas || [];
        this.filteredFormulas$ = this.searchForm.get('formula').valueChanges.pipe(
          startWith(''),
          map(value => typeof value === 'string' ? value : value?.nombre),
          map(name => name ? this._filterFormulas(name) : this.allFormulas.slice())
        );
      }
    });
  }
  search(): void {
    this.paginator.pageIndex = 0;
    this.paginator.page.emit();
  }

  loadDataObservable(): Observable<IRegistroEnvio[]> {
    const params = this.buildRequestParams();
    return this.lotService.getRegistroEnvios(params).pipe(
      map(response => {
        const normalized = this.tableDataService.normalizeResponse<IRegistroEnvio>(response, this.pageSize);
        this.totalReg = normalized.total;
        if (this.paginator) {
          this.paginator.length = this.totalReg;
        }
        return normalized.items;
      }),
      catchError(() => of([]))
    );
  }

  private buildRequestParams(): any {
    const formValues = this.searchForm.value;

    return {
      page: (this.paginator && this.paginator.pageIndex !== undefined) ? this.paginator.pageIndex : 0,
      pageSize: (this.paginator && this.paginator.pageSize) ? this.paginator.pageSize : this.pageSize,
      asc: this.sort ? this.sort.direction === 'asc' : false,
      idx: this.sort?.active || 'fechaCreacion',
      fechaDesde: formValues.fechaDesde ? this.datePipe.transform(formValues.fechaDesde, 'dd/MM/yyyy') : null,
      fechaHasta: formValues.fechaHasta ? this.datePipe.transform(formValues.fechaHasta, 'dd/MM/yyyy') : null,
      idCliente: formValues.cliente?.id || null,
      idFormula: formValues.formula?.id || null,
      nroLote: formValues.nroLote || null,
      email: formValues.email || null
    };
  }

  limpiarFiltros(): void {
    this.searchForm.reset();
    this.clearClientInput();
    this.clearFormulaInput();
    this.search();
  }

  displayClient(client: Cliente): string {
    return client ? client.nombre : '';
  }

  displayFormula(formula: IFormula): string {
    return formula ? formula.nombre : '';
  }

  private _filterClients(value: string | Cliente): Cliente[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    return this.allClients.filter(client =>
      client.nombre.toLowerCase().includes(filterValue) ||
      (client.codigo && client.codigo.toLowerCase().includes(filterValue))
    );
  }

  private _filterFormulas(value: string): IFormula[] {
    const filterValue = value.toLowerCase();
    return this.allFormulas.filter(formula =>
      formula.nombre.toLowerCase().includes(filterValue)
    );
  }

  clearClientInput(): void {
    this.searchForm.get('cliente').setValue(null);
    if (this.clientInput) this.clientInput.nativeElement.value = '';
  }

  clearFormulaInput(): void {
    this.searchForm.get('formula').setValue(null);
    if (this.formulaInput) this.formulaInput.nativeElement.value = '';
  }
}