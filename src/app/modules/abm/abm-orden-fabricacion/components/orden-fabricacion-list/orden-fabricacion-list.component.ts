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
import { AsignarPrensaDialogComponent } from '../dialogs/asignar-prensa-dialog/asignar-prensa-dialog.component';
import { FinalizarOrdenDialogComponent } from '../dialogs/finalizar-orden-dialog/finalizar-orden-dialog.component';
import { RegistrarEntregaDialogComponent } from '../dialogs/registrar-entrega-dialog/registrar-entrega-dialog.component';
import { OtPreviewDialogComponent } from '../dialogs/ot-preview-dialog/ot-preview-dialog.component';
import moment from 'moment';
import { generarHtmlOT } from '../../utils/ot-html.generator';

type ClienteNitrophyl = Omit<Partial<Cliente>, 'id'> & { id: number | null; nombre: string };

@Component({
    selector: 'app-orden-fabricacion-list',
    templateUrl: './orden-fabricacion-list.component.html',
    styleUrls: ['./orden-fabricacion-list.component.scss'],
})
export class OrdenFabricacionListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild('clientInput', { read: MatAutocompleteTrigger }) clientAutocompleteTrigger!: MatAutocompleteTrigger;
    @ViewChild('piezaInput', { read: MatAutocompleteTrigger }) piezaAutocompleteTrigger!: MatAutocompleteTrigger;

    isLoading = true;
    dataSource = new MatTableDataSource<IOrdenFabricacion>([]);
    displayedColumns: string[] = [
        'ocFecha', 'cliente', 'pieza', 'formula', 'ocCantidad',
        'ofFecha', 'fechaEntrega', 'estado', 'ofNumero', 'entregadas', 'saldo', 'acciones'
    ];
    totalReg: number = 0;

    searchForm: FormGroup;
    clientes: ClienteNitrophyl[] = [];
    filteredClientes$!: Observable<ClienteNitrophyl[]>;
    piezas: any[] = [];
    filteredPiezas$!: Observable<any[]>;

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
            tipoFecha: [''],
            fechaDesde: [null],
            fechaHasta: [null],
            estado: [''],
            pieza: [null],
            anioOF: [''],
            numeroOF: ['']
        });
    }

    ngOnInit(): void {
        this.loadClientes();
        this.loadPiezas();
    }

    ngAfterViewInit(): void {
        merge(this.sort.sortChange, this.paginator.page).pipe(
            startWith({}),
            switchMap(() => {
                const formValues = this.searchForm.value;
                if ((formValues.fechaDesde || formValues.fechaHasta) && !formValues.tipoFecha) {
                    this._notificationService.showError('Debe seleccionar el tipo de fecha para aplicar el filtro de fechas.');
                    this.isLoading = false;
                    return of(null);
                }
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
                if (response && response.data && response.data.page) {
                    this.totalReg = response.data.totalReg;

                    const filasPlanas: IOrdenFabricacion[] = [];

                    response.data.page.forEach((orden: any) => {
                        const anio = orden.anio || (orden.fechaOF ? moment(orden.fechaOF, 'DD/MM/YYYY').year() : null);
                        const numero = orden.numero;
                        const formattedNumero = (anio && numero) ? `${anio}/${String(numero).padStart(3, '0')}` : '-';

                        const piezas: IOrdenFabricacionPieza[] = [
                            {
                                idPieza: orden.idPieza,
                                codigoPieza: orden.piezaCodigo,
                                nombrePieza: orden.piezaCodigo,
                                idFormula: orden.idFormula,
                                cantidadSolicitada: orden.totalSolicitado,
                                stockActual: 0,
                                cantidadAFabricar: orden.saldo,
                                tieneCotizacion: false
                            }
                        ];

                        filasPlanas.push({
                            ...orden,
                            id: orden.id || orden.idOrdenFabricacion,
                            estado: orden.estadoOF,
                            fecha: orden.fechaOF ? moment(orden.fechaOF, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
                            fechaEstimada: orden.fechaEntregaSolicitada ? moment(orden.fechaEntregaSolicitada, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
                            ocNro: orden.idOrdenCompra ? String(orden.idOrdenCompra) : '-',
                            ocFecha: orden.fechaOC ? moment(orden.fechaOC, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
                            piezas: piezas,
                            piezaNombre: orden.piezaCodigo || '-',
                            piezaFormula: orden.formulaNombre || 'NK',
                            ocCantidad: orden.totalSolicitado || 0,
                            entregadas: orden.totalFabricado || 0,
                            saldo: orden.saldo || 0,
                            cantFabrica: orden.saldo || 0,
                            cantStock: 0,
                            maquina: orden.prensa || '-',
                            facturada: 0,
                            formattedNumero: formattedNumero
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
        let activeSort = this.sort?.active || 'fecha_OF';
        if (activeSort === 'ocFecha') {
            activeSort = 'fecha_OC';
        } else if (activeSort === 'ofFecha') {
            activeSort = 'fecha_OF';
        } else if (activeSort === 'fechaEntrega') {
            activeSort = 'fecha_entrega';
        }

        return {
            first: this.paginator.pageIndex * this.paginator.pageSize,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: activeSort,
            idCliente: formValues.cliente?.id,
            tipoFecha: formValues.tipoFecha || null,
            fechaDesde: formValues.fechaDesde ? moment(formValues.fechaDesde).format('DD/MM/YYYY') : null,
            fechaHasta: formValues.fechaHasta ? moment(formValues.fechaHasta).format('DD/MM/YYYY') : null,
            estado: formValues.estado || null,
            idPieza: formValues.pieza?.id || null,
            anioOF: formValues.anioOF || null,
            numeroOF: formValues.numeroOF || null
        };
    }

    loadClientes(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res) => {
                this.clientes = [{ id: null, nombre: 'Nitrophyl' }, ...res.data];
                this.filteredClientes$ = this.searchForm.get('cliente')!.valueChanges.pipe(
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
        return this.piezas.filter(p => p.denominacion.toLowerCase().includes(filterValue) || p.codigo?.toLowerCase().includes(filterValue));
    }

    displayFnPieza(pieza: any): string {
        return pieza?.denominacion || '';
    }

    clearPiezaSelection(): void {
        this.searchForm.get('pieza')!.setValue('');
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.piezaAutocompleteTrigger) {
                this.piezaAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    search(): void {
        const formValues = this.searchForm.value;
        if ((formValues.fechaDesde || formValues.fechaHasta) && !formValues.tipoFecha) {
            this._notificationService.showError('Debe seleccionar el tipo de fecha para aplicar el filtro de fechas.');
            return;
        }
        this.paginator.pageIndex = 0;
        this.paginator.page.emit();
    }

    limpiarFiltros(): void {
        this.searchForm.reset({
            cliente: null,
            tipoFecha: '',
            fechaDesde: null,
            fechaHasta: null,
            estado: '',
            pieza: null,
            anioOF: '',
            numeroOF: ''
        });
        this.search();
    }

    displayFn(cliente: Cliente): string {
        return cliente?.nombre || '';
    }

    clearClientSelection(): void {
        this.searchForm.get('cliente')!.setValue('');
        this._changeDetectorRef.detectChanges();
        setTimeout(() => {
            if (this.clientAutocompleteTrigger) {
                this.clientAutocompleteTrigger.openPanel();
            }
        }, 50);
    }

    asignarPrensa(orden: IOrdenFabricacion): void {
        const dialogRef = this._dialog.open(AsignarPrensaDialogComponent, {
            width: '500px',
            panelClass: 'custom-dialog-container',
            data: {
                idOrden: orden.id
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;
                this._ordenFabricacionService.asignarOrden(orden.id, result).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Orden asignada correctamente');
                        this.search();
                    },
                    error: () => {
                        this.isLoading = false;
                        this._notificationService.showError('Error al asignar la orden');
                    }
                });
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

    registrarEntrega(el: any): void {
        const pieza = el.piezas[0];
        const dialogRef = this._dialog.open(RegistrarEntregaDialogComponent, {
            width: '450px',
            data: {
                saldoPendiente: el.saldo,
                idFormula: pieza?.idFormula || pieza?.id
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading = true;
                this._ordenFabricacionService.registrarEntrega(el.id, result).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Entrega registrada correctamente');
                        this.search();
                    },
                    error: () => {
                        this.isLoading = false;
                        this._notificationService.showError('Error al registrar la entrega');
                    }
                });
            }
        });
    }

    verOT(el: any): void {
        this._ordenFabricacionService.getOrdenFabricacionOT(el.id).subscribe({
            next: (response: any) => {
                if (response?.status === 'OK' && response?.data) {
                    const html = generarHtmlOT(response.data);
                    const title = `Orden de Trabajo - OT ${response.data.cabecera?.numero_ot || ''}`;
                    this._dialog.open(OtPreviewDialogComponent, {
                        width: '1000px',
                        maxWidth: '95vw',
                        panelClass: 'ot-preview-dialog-panel',
                        data: {
                            html: html,
                            title: title
                        }
                    });
                } else {
                    this._notificationService.showError('No se pudo obtener la OT.');
                }
            },
            error: () => {
                this._notificationService.showError('Error al obtener la Orden de Trabajo.');
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