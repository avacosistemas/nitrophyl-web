import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subject, merge, of, Observable } from 'rxjs';
import { startWith, switchMap, map, catchError, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Cliente } from 'app/shared/models/cliente.model';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import moment from 'moment';
import { IOrdenCompraPendiente, IOrdenCompraPendientesParams } from '../../models/orden-compra.interface';

@Component({
    selector: 'app-orden-compra-pendientes-list',
    templateUrl: './orden-compra-pendientes-list.component.html',
})
export class OrdenCompraPendientesListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) clienteAutocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild('piezaInput', { read: MatAutocompleteTrigger }) piezaAutocompleteTrigger: MatAutocompleteTrigger;

    isLoading = true;
    dataSource = new MatTableDataSource<IOrdenCompraPendiente>([]);
    displayedColumns: string[] = ['comprobante', 'fechaOC', 'cliente', 'pieza', 'cantidad', 'formula', 'fechaEntrega'];
    totalReg: number = 0;

    searchForm: FormGroup;
    clientes: Cliente[] = [];
    filteredClientes$: Observable<Cliente[]>;
    piezas: any[] = [];
    filteredPiezas$: Observable<any[]>;

    private _destroying$ = new Subject<void>();

    constructor(
        private _ordenCompraService: AbmOrdenCompraService,
        private _clientesService: ClientesService,
        private _notificationService: NotificationService,
        private _fb: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.searchForm = this._fb.group({
            cliente: [null],
            pieza: [null],
            fechaDesde: [null],
            fechaHasta: [null],
            fechaEntregaDesde: [null],
            fechaEntregaHasta: [null],
            comprobante: ['']
        });
    }

    ngOnInit(): void {
        this._ordenCompraService.updateHeaderTitle('Pendientes');
        this._ordenCompraService.updateHeaderSubtitle('');
        this._ordenCompraService.updateHeaderBreadcrumbs([
            { title: 'Administración', route: [], condition: true },
            { title: 'Órdenes de Compra', route: ['/orden-compra'], condition: true },
            { title: 'Pendientes', route: ['/orden-compra/pendientes'], condition: true }
        ]);
        this._ordenCompraService.updateHeaderButtons([]);
        
        this.loadClientes();
        this.loadPiezas();
    }

    ngAfterViewInit(): void {
        merge(this.sort.sortChange, this.paginator.page).pipe(
            startWith({}),
            switchMap(() => {
                this.isLoading = true;
                const params = this.buildRequestParams();
                return this._ordenCompraService.getOrdenesCompraPendientes(params).pipe(
                    catchError(() => {
                        this._notificationService.showError('Error al cargar las órdenes de compra pendientes.');
                        return of(null);
                    })
                );
            }),
            map(response => {
                this.isLoading = false;
                if (response && response.data) {
                    this.totalReg = response.data.totalReg;
                    return response.data.page;
                }
                return [];
            }),
            takeUntil(this._destroying$)
        ).subscribe(data => this.dataSource.data = data);
    }

    ngOnDestroy(): void {
        this._destroying$.next();
        this._destroying$.complete();
    }

    private buildRequestParams(): IOrdenCompraPendientesParams {
        const formValues = this.searchForm.value;
        return {
            first: this.paginator.pageIndex * this.paginator.pageSize,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: this.sort.active || 'fechaOC',
            comprobante: formValues.comprobante,
            fechaDesde: formValues.fechaDesde ? moment(formValues.fechaDesde).format('DD/MM/YYYY') : null,
            fechaHasta: formValues.fechaHasta ? moment(formValues.fechaHasta).format('DD/MM/YYYY') : null,
            fechaEntregaDesde: formValues.fechaEntregaDesde ? moment(formValues.fechaEntregaDesde).format('DD/MM/YYYY') : null,
            fechaEntregaHasta: formValues.fechaEntregaHasta ? moment(formValues.fechaEntregaHasta).format('DD/MM/YYYY') : null,
            idCliente: formValues.cliente?.id,
            idPieza: formValues.pieza?.id,
        };
    }
    
    loadClientes(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res) => {
                this.clientes = res.data || [];
                this.filteredClientes$ = this.searchForm.get('cliente').valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterClientes(value))
                );
            },
            error: () => this._notificationService.showError('Error al cargar clientes.')
        });
    }

    private _filterClientes(value: string | Cliente): Cliente[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.clientes.filter(c => c.nombre.toLowerCase().includes(filterValue) || c.codigo?.toLowerCase().includes(filterValue));
    }

    loadPiezas(): void {
        this.filteredPiezas$ = this.searchForm.get('pieza').valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(piezaVal => {
                const search = typeof piezaVal === 'string' ? piezaVal : (piezaVal?.nombre || piezaVal?.denominacion || '');
                return this._ordenCompraService.getPiezasCombo(null, search).pipe(
                    map(res => res.data || []),
                    catchError(() => of([]))
                );
            }),
            takeUntil(this._destroying$)
        );
    }

    search(): void {
        this.paginator.pageIndex = 0;
        this.paginator.page.emit();
    }

    limpiarFiltros(): void {
        this.searchForm.reset();
        this.search();
    }

    displayFnCliente(cliente: Cliente): string {
        return cliente?.nombre || '';
    }

    displayFnPieza(pieza: any): string {
        return pieza ? (pieza.nombre || pieza.denominacion) : '';
    }

    clearComprobanteSelection(): void {
        this.searchForm.get('comprobante').setValue('');
    }

    clearClientSelection(): void {
        this.searchForm.get('cliente').setValue('');
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.clienteAutocompleteTrigger) {
                this.clienteAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    clearPiezaSelection(): void {
        this.searchForm.get('pieza').setValue('');
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.piezaAutocompleteTrigger) {
                this.piezaAutocompleteTrigger.openPanel();
            }
        }, 50);
    }
}
