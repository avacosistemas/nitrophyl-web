import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { merge, Observable, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { AbmOrdenFabricacionService } from '../../abm-orden-fabricacion.service';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { TableDataService } from 'app/shared/services/table-data.service';
import { IEntregaGrillaItem } from '../../models/entrega-grilla.interface';

@Component({
    selector: 'app-entregas-list',
    templateUrl: './entregas-list.component.html'
})
export class EntregasListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild('clientInput', { read: MatAutocompleteTrigger }) clientAutocompleteTrigger?: MatAutocompleteTrigger;
    @ViewChild('piezaInput', { read: MatAutocompleteTrigger }) piezaAutocompleteTrigger?: MatAutocompleteTrigger;

    searchForm: FormGroup;
    dataSource = new MatTableDataSource<IEntregaGrillaItem>([]);
    displayedColumns: string[] = [
        'cantidad',
        'fecha',
        'lotes',
        'operario',
        'numeroOT',
        'pieza',
        'cliente',
        'comprobante',
        'idOrdenFabricacion'
    ];

    isLoading = false;
    totalReg = 0;
    pageSize = 20;

    clientes: any[] = [];
    filteredClientes$!: Observable<any[]>;
    piezas: any[] = [];
    filteredPiezas$!: Observable<any[]>;

    private _destroying$ = new Subject<void>();

    constructor(
        private _ordenFabricacionService: AbmOrdenFabricacionService,
        private _clientesService: ClientesService,
        private _notificationService: NotificationService,
        private _fb: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _tableDataService: TableDataService
    ) {
        this.searchForm = this._fb.group({
            fechaDesde: [null],
            fechaHasta: [null],
            cliente: [null],
            pieza: [null]
        });
    }

    ngOnInit(): void {
        this.loadClientes();
        this.loadPiezas();
    }

    ngAfterViewInit(): void {
        this.sort.sortChange.pipe(takeUntil(this._destroying$)).subscribe(() => {
            if (this.paginator) {
                this.paginator.pageIndex = 0;
            }
        });

        merge(this.sort.sortChange, this.paginator.page).pipe(
            startWith({}),
            switchMap(() => {
                this.isLoading = true;
                const params = this.buildRequestParams();
                return this._ordenFabricacionService.getEntregasGrilla(params).pipe(
                    catchError(() => {
                        this._notificationService.showError('Error al cargar las entregas.');
                        return of(null);
                    })
                );
            }),
            map((response: any) => {
                this.isLoading = false;
                const pageSize = this.paginator?.pageSize || 10;
                const normalized = this._tableDataService.normalizeResponse<IEntregaGrillaItem>(response, pageSize);
                this.totalReg = normalized.totalReg;
                return normalized.data || [];
            }),
            takeUntil(this._destroying$)
        ).subscribe(data => {
            this.dataSource.data = data;
            this._changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this._destroying$.next();
        this._destroying$.complete();
    }

    search(): void {
        if (this.paginator) {
            this.paginator.pageIndex = 0;
            this.paginator.page.emit();
        }
    }

    limpiarFiltros(): void {
        this.searchForm.reset({
            fechaDesde: null,
            fechaHasta: null,
            cliente: null,
            pieza: null
        });
        this.search();
    }

    private buildRequestParams(): any {
        const formValues = this.searchForm.value;
        const pageSize = this.paginator?.pageSize || 10;
        const pageIndex = this.paginator?.pageIndex || 0;

        return {
            page: pageIndex,
            pageSize: pageSize,
            asc: this.sort ? this.sort.direction !== 'desc' : false,
            idx: this.sort?.active || 'fecha',
            fechaDesde: formValues.fechaDesde ? moment(formValues.fechaDesde).format('DD/MM/YYYY') : null,
            fechaHasta: formValues.fechaHasta ? moment(formValues.fechaHasta).format('DD/MM/YYYY') : null,
            idCliente: formValues.cliente?.id || null,
            idPieza: formValues.pieza?.id || null
        };
    }

    loadClientes(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res) => {
                this.clientes = [{ id: null, nombre: 'Nitrophyl' }, ...(res.data || [])];
                this.filteredClientes$ = this.searchForm.get('cliente')!.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterClientes(value))
                );
            },
            error: () => this._notificationService.showError('Error al cargar clientes.')
        });
    }

    private _filterClientes(value: string | any): any[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.clientes.filter(c => c.nombre.toLowerCase().includes(filterValue));
    }

    displayFnCliente(cliente: any): string {
        return cliente?.nombre || '';
    }

    clearClientSelection(): void {
        this.searchForm.get('cliente')!.setValue(null);
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.clientAutocompleteTrigger) {
                this.clientAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    loadPiezas(): void {
        this._ordenFabricacionService.getPiezas(null, false).pipe(takeUntil(this._destroying$)).subscribe({
            next: (res) => {
                this.piezas = res?.data || [];
                this.filteredPiezas$ = this.searchForm.get('pieza')!.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterPiezas(value))
                );
            },
            error: () => this._notificationService.showError('Error al cargar piezas.')
        });
    }

    private _filterPiezas(value: string | any): any[] {
        const filterValue = (typeof value === 'string' ? value : (value?.denominacion || '')).toLowerCase();
        return this.piezas.filter(p =>
            (p.denominacion && p.denominacion.toLowerCase().includes(filterValue)) ||
            (p.codigo && p.codigo.toLowerCase().includes(filterValue))
        );
    }

    displayFnPieza(pieza: any): string {
        return pieza?.denominacion || '';
    }

    clearPiezaSelection(): void {
        this.searchForm.get('pieza')!.setValue(null);
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.piezaAutocompleteTrigger) {
                this.piezaAutocompleteTrigger.openPanel();
            }
        }, 50);
    }
}
