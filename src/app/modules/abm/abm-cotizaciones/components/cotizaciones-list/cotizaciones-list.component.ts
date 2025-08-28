import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject, merge, of } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil, debounceTime } from 'rxjs/operators';
import { ICotizacion } from '../../models/cotizacion.model';
import { CotizacionesService } from '../../cotizaciones.service';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { NotificationService } from 'app/shared/services/notification.service';

interface Cliente {
    id: number;
    nombre: string;
    codigo?: string;
}
@Component({
    selector: 'app-cotizaciones-list',
    templateUrl: './cotizaciones-list.component.html',
    styleUrls: ['./cotizaciones-list.component.scss']
})
export class CotizacionesListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('clienteInput') clienteInput: ElementRef<HTMLInputElement>;
    @ViewChild('piezaInput') piezaInput: ElementRef<HTMLInputElement>;

    private _destroying$ = new Subject<void>();

    isLoading = true;
    dataSource = new MatTableDataSource<ICotizacion>([]);
    displayedColumns: string[] = ['pieza', 'material', 'cliente', 'valor', 'fecha', 'observaciones'];
    totalReg: number = 0;

    searchForm: FormGroup;
    clientesDisponibles: Cliente[] = [];
    filteredClientes$: Observable<Cliente[]>;
    filteredPiezas$: Observable<any[]>;

    constructor(
        private _cotizacionesService: CotizacionesService,
        private _abmPiezasService: ABMPiezaService,
        private _clientesService: ClientesService,
        private _notificationService: NotificationService,
        private _fb: FormBuilder
    ) {
        this.searchForm = this._fb.group({
            cliente: [null],
            pieza: [null]
        });
    }

    ngOnInit(): void {
        this.loadClientesDropdown();
        this.setupPiezasAutocomplete();
    }

    ngAfterViewInit(): void {
        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.isLoading = true;
                    const params = this.buildRequestParams();
                    return this._cotizacionesService.getCotizaciones(params).pipe(
                        catchError(() => {
                            this._notificationService.showError('Error al cargar las cotizaciones.');
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
            ).subscribe(data => {
                this.dataSource.data = data;
            });
    }

    ngOnDestroy(): void {
        this._destroying$.next();
        this._destroying$.complete();
    }

    loadClientesDropdown(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res: any) => {
                this.clientesDisponibles = res?.data || [];
                this.filteredClientes$ = this.searchForm.get('cliente').valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterClientes(value))
                );
            },
            error: (err) => {
                console.error('Error al cargar la lista de clientes:', err);
                this._notificationService.showError('Error al cargar la lista de clientes.');
            }
        });
    }

    private _filterClientes(value: string | Cliente): Cliente[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        if (!filterValue) {
            return this.clientesDisponibles;
        }
        return this.clientesDisponibles.filter(cliente =>
            cliente.nombre.toLowerCase().includes(filterValue) ||
            (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
        );
    }

    setupPiezasAutocomplete(): void {
        this.filteredPiezas$ = this.searchForm.get('pieza').valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            switchMap(value => {
                const searchTerm = typeof value === 'string' ? value : value?.denominacion;
                if (typeof value === 'object' && value !== null) {
                    return of([]);
                }
                return this._abmPiezasService.getPiezas({ nombre: searchTerm || '', rows: 50 }).pipe(
                    map(res => res.data.page),
                    catchError(() => of([]))
                );
            })
        );
    }

    private buildRequestParams(): any {
        const formValues = this.searchForm.value;
        const params: any = {
            first: this.paginator.pageIndex * this.paginator.pageSize || 0,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: this.sort.active || 'fecha',
            idCliente: formValues.cliente?.id,
            idPieza: formValues.pieza?.id,
        };
        return params;
    }

    search(): void {
        this.paginator.pageIndex = 0;
        this.paginator.page.emit();
    }

    limpiarFiltros(): void {
        this.searchForm.reset();
        this.search();
    }

    clearClienteInput(): void {
        this.searchForm.get('cliente')?.setValue(null);
        if (this.clienteInput) this.clienteInput.nativeElement.value = '';
    }

    clearPiezaInput(): void {
        this.searchForm.get('pieza')?.setValue(null);
        if (this.piezaInput) this.piezaInput.nativeElement.value = '';
    }

    displayFn(item: any): string {
        if (!item) { return ''; }
        if (item.denominacion) {
            return item.codigo ? `${item.codigo} - ${item.denominacion}` : item.denominacion;
        }
        if (item.nombre) {
            return item.codigo ? `${item.codigo} - ${item.nombre}` : item.nombre;
        }
        return '';
    }

    displayCliente(cliente: Cliente): string {
        return cliente && cliente.nombre ? cliente.nombre : '';
    }

    public refreshData(): void {
        this.paginator.page.emit();
    }
}