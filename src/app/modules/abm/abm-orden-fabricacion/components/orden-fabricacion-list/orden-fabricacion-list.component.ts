import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subject, merge, of, Observable } from 'rxjs';
import { startWith, switchMap, map, catchError, takeUntil } from 'rxjs/operators';
import { IOrdenFabricacion, IOrdenFabricacionPieza } from '../../models/orden-fabricacion.interface';
import { AbmOrdenFabricacionService } from '../../abm-orden-fabricacion.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Cliente } from 'app/shared/models/cliente.model';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete'
import { MatDialog } from '@angular/material/dialog';
import { AsignarPrensaDialogComponent } from '../dialogs/asignar-prensa-dialog.component';
import { FinalizarOrdenDialogComponent } from '../dialogs/finalizar-orden-dialog.component';

type ClienteNitrophyl = Partial<Cliente> & { id: number | null; nombre: string };

@Component({
    selector: 'app-orden-fabricacion-list',
    templateUrl: './orden-fabricacion-list.component.html',
})
export class OrdenFabricacionListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('clientInput', { read: MatAutocompleteTrigger }) clientAutocompleteTrigger: MatAutocompleteTrigger;

    isLoading = true;
    dataSource = new MatTableDataSource<IOrdenFabricacion>([]);
    displayedColumns: string[] = [
        'ocNro', 'ocFecha', 'cliente', 'pieza', 'formula', 'ocCantidad',
        'ofNro', 'ofFecha', 'estado', 'deFabrica', 'deStock', 'prensa', 'operario', 'estimada', 'entregada', 'acciones'
    ];
    totalReg: number = 0;

    searchForm: FormGroup;
    clientes: ClienteNitrophyl[] = [];
    filteredClientes$: Observable<ClienteNitrophyl[]>;

    private _destroying$ = new Subject<void>();

    constructor(
        private _ordenFabricacionService: AbmOrdenFabricacionService,
        private _clientesService: ClientesService,
        private _notificationService: NotificationService,
        private _fb: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _dialog: MatDialog
    ) {
        this.searchForm = this._fb.group({
            cliente: [null],
            fechaDesde: [null],
            fechaHasta: [null],
            nroOrden: [''],
            estado: ['']
        });
    }

    ngOnInit(): void {
        this.loadClientes();
    }

    ngAfterViewInit(): void {
        merge(this.sort.sortChange, this.paginator.page).pipe(
            startWith({}),
            switchMap(() => {
                this.isLoading = true;
                const params = this.buildRequestParams();
                return this._ordenFabricacionService.getOrdenesFabricacion(params).pipe(
                    catchError(() => {
                        this._notificationService.showError('Error al cargar las órdenes.');
                        return of(null);
                    })
                );
            }),
            map((response: any) => {
                this.isLoading = false;
                if (response && response.data) {
                    this.totalReg = response.data.totalReg;

                    const filasPlanas = [];

                    response.data.page.forEach((orden: IOrdenFabricacion) => {

                        const piezaPrincipal: IOrdenFabricacionPieza = orden.piezas[0] || ({} as IOrdenFabricacionPieza);

                        filasPlanas.push({
                            ...orden,

                            ocNro: orden.ordenCompraNro,
                            ocFecha: orden.ordenCompraFecha,

                            piezaNombre: piezaPrincipal.nombrePieza || '-',
                            piezaFormula: 'NK',
                            ocCantidad: piezaPrincipal.cantidadSolicitada || 0,

                            cantFabrica: piezaPrincipal.cantidadAFabricar || 0,
                            cantStock: piezaPrincipal.stockActual || 0,
                            prensa: orden.prensa || null,
                            operario: orden.operario || null,
                            fechaEstimada: orden.fechaEstimada || null,
                            fechaEntregada: orden.fechaEntregada || null
                        });
                    });

                    return filasPlanas;
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

    private buildRequestParams(): any {
        const formValues = this.searchForm.value;
        const params: any = {
            first: this.paginator.pageIndex * this.paginator.pageSize,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: this.sort.active || 'fecha',
            idCliente: formValues.cliente?.id,
            fechaDesde: formValues.fechaDesde ? new Date(formValues.fechaDesde).toLocaleDateString('en-GB') : null,
            fechaHasta: formValues.fechaHasta ? new Date(formValues.fechaHasta).toLocaleDateString('en-GB') : null,
            nroOrden: formValues.nroOrden,
            estado: formValues.estado
        };
        return params;
    }

    loadClientes(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res) => {
                this.clientes = [{ id: null, nombre: 'Nitrophyl' }, ...res.data];
                this.filteredClientes$ = this.searchForm.get('cliente').valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterClientes(value))
                );
            },
            error: () => this._notificationService.showError('Error al cargar clientes.')
        });
    }

    private _filterClientes(value: string | ClienteNitrophyl): ClienteNitrophyl[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.clientes.filter(c => c.nombre.toLowerCase().includes(filterValue));
    }

    search(): void {
        this.paginator.pageIndex = 0;
        this.paginator.page.emit();
    }

    limpiarFiltros(): void {
        this.searchForm.reset({ estado: '' });
        this.search();
    }

    displayFn(cliente: Cliente): string {
        return cliente?.nombre || '';
    }

    clearClientSelection(): void {
        this.searchForm.get('cliente').setValue('');
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.clientAutocompleteTrigger) {
                this.clientAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    asignarPrensa(orden: IOrdenFabricacion): void {
        const dialogRef = this._dialog.open(AsignarPrensaDialogComponent, {
            width: '600px',
            data: {

                sugeridoFabrica: orden.piezas[0]?.cantidadAFabricar,
                sugeridoStock: orden.piezas[0]?.stockActual
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;


                console.log('Datos a guardar:', result);


                setTimeout(() => {
                    this._notificationService.showSuccess('Orden asignada a prensa correctamente');
                    this.search();
                }, 1000);
            }
        });
    }

    finalizarOrden(orden: IOrdenFabricacion): void {
        const dialogRef = this._dialog.open(FinalizarOrdenDialogComponent, {
            width: '400px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;

                console.log('Finalizar con fecha:', result.fechaEntregada);

                setTimeout(() => {
                    this._notificationService.showSuccess('Orden finalizada correctamente');
                    this.search();
                }, 1000);
            }
        });
    }

    formatEstado(estado: string): string {
        switch (estado) {
            case 'EN_PROCESO': return 'En Proceso';
            case 'PENDIENTE': return 'Pendiente';
            case 'FINALIZADA': return 'Finalizada';
            default: return estado;
        }
    }
}