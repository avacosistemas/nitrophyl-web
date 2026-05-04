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
import moment from 'moment';

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
        'ocFecha', 'ocComprobante', 'cliente', 'pieza', 'formula', 'ocCantidad',
        'ofFecha', 'fechaEntrega', 'estado', 'deFabrica', 'deStock', 'maquina', 'saldo', 'facturada', 'entregadas', 'acciones'
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
            comprobante: [''],
            fechaDesde: [null],
            fechaHasta: [null],
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
                            piezas: orden.piezas, 
                            piezaNombre: piezaPrincipal.nombrePieza || '-',
                            piezaFormula: piezaPrincipal.codigoPieza || 'NK',
                            ocCantidad: piezaPrincipal.cantidadSolicitada || 0,

                            entregadas: orden.entregadas || 0,
                            saldo: orden.saldo || 0,
                            fechaEstimada: orden.fechaEstimada || null,

                            cantFabrica: piezaPrincipal.cantidadAFabricar || 0,
                            cantStock: piezaPrincipal.stockActual || 0,
                            maquina: orden.prensa || '-',
                            facturada: 0
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
        return {
            first: this.paginator.pageIndex * this.paginator.pageSize,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: this.sort.active || 'fecha',
            idCliente: formValues.cliente?.id,
            comprobante: formValues.comprobante,
            fechaDesde: formValues.fechaDesde ? moment(formValues.fechaDesde).format('DD/MM/YYYY') : null,
            fechaHasta: formValues.fechaHasta ? moment(formValues.fechaHasta).format('DD/MM/YYYY') : null,
            estado: formValues.estado
        };
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
        const pieza = orden.piezas && orden.piezas.length > 0 ? orden.piezas[0] : null;

        const dialogRef = this._dialog.open(AsignarPrensaDialogComponent, {
            width: '600px',
            panelClass: 'custom-dialog-container',
            data: {
                cantidadSolicitada: pieza ? pieza.cantidadSolicitada : 0,
                stockDisponible: pieza ? pieza.stockActual : 0,
                sugeridoFabrica: pieza ? pieza.cantidadAFabricar : 0,
                sugeridoStock: 0,
                fechaEstimada: orden.fechaEstimada || null
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

    finalizarOrden(el: any): void {
        const pieza = el.piezas[0];
        const dialogRef = this._dialog.open(FinalizarOrdenDialogComponent, {
            width: '400px',
            data: {
                saldoPendiente: el.saldo,
                idFormula: pieza.idFormula || pieza.id
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;
                const payload = {
                    idOrden: el.id,
                    cantidad: result.cantidad,
                    fecha: moment(result.fechaEntregada).format('DD/MM/YYYY'),
                    idLote: result.lote.id,
                    excedente: result.excedente
                };

                this._ordenFabricacionService.registrarProduccion(payload).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Producción registrada correctamente');
                        this.search();
                    },
                    error: () => {
                        this.isLoading = false;
                        this._notificationService.showError('Error al registrar la producción');
                    }
                });
            }
        });
    }

    formatEstado(estado: string): string {
        switch (estado) {
            case 'EN_PROCESO': return 'En Proceso';
            case 'PENDIENTE': return 'Pendiente';
            case 'FINALIZADA': return 'Producida';
            default: return estado;
        }
    }
}