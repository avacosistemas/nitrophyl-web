import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subject, merge, of, Observable } from 'rxjs';
import { startWith, switchMap, map, catchError, takeUntil } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import * as FileSaver from 'file-saver';
import { IOrdenCompra } from '../../models/orden-compra.interface';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { Cliente } from 'app/modules/abm/abm-clientes/cliente.model';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import moment from 'moment';
import { OrdenCompraCancelModalComponent } from '../orden-compra-cancel-modal/orden-compra-cancel-modal.component';

@Component({
    selector: 'app-orden-compra-list',
    templateUrl: './orden-compra-list.component.html',
})
export class OrdenCompraListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator?: MatPaginator;
    @ViewChild(MatSort) sort?: MatSort;
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) clienteAutocompleteTrigger?: MatAutocompleteTrigger;

    isLoading = true;
    dataSource = new MatTableDataSource<IOrdenCompra>([]);
    displayedColumns: string[] = ['fecha', 'cliente', 'comprobante', 'estado', 'acciones'];
    totalReg: number = 0;

    searchForm: FormGroup;
    clientes: Cliente[] = [];
    filteredClientes$?: Observable<Cliente[]>;

    private _destroying$ = new Subject<void>();

    constructor(
        private _ordenCompraService: AbmOrdenCompraService,
        private _clientesService: ClientesService,
        public dialog: MatDialog,
        private _notificationService: NotificationService,
        private _sanitizer: DomSanitizer,
        private _fb: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router
    ) {
        this.searchForm = this._fb.group({
            cliente: [null],
            fechaDesde: [null],
            fechaHasta: [null],
            comprobante: ['']
        });
    }

    ngOnInit(): void {
        this._ordenCompraService.updateHeaderTitle('Órdenes de Compra');
        this._ordenCompraService.updateHeaderSubtitle('');
        this._ordenCompraService.updateHeaderBreadcrumbs([
            { title: 'Administración', route: [], condition: true },
            { title: 'Órdenes de Compra', route: ['/orden-compra'], condition: true }
        ]);
        this._ordenCompraService.updateHeaderButtons([{ type: 'flat', label: 'Crear Orden de Compra', action: 'create', condition: true }]);
        this.loadClientes();
    }

    ngAfterViewInit(): void {
        merge(this.sort.sortChange, this.paginator.page).pipe(
            startWith({}),
            switchMap(() => {
                this.isLoading = true;
                const params = this.buildRequestParams();
                return this._ordenCompraService.getOrdenesCompra(params).pipe(
                    catchError(() => {
                        this._notificationService.showError('Error al cargar las órdenes de compra.');
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

    private buildRequestParams(): any {
        const formValues = this.searchForm.value;
        return {
            first: this.paginator.pageIndex * this.paginator.pageSize,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: this.sort.active || 'fecha',
            comprobante: formValues.comprobante,
            fechaDesde: formValues.fechaDesde ? moment(formValues.fechaDesde).format('DD/MM/YYYY') : null,
            fechaHasta: formValues.fechaHasta ? moment(formValues.fechaHasta).format('DD/MM/YYYY') : null,
            idCliente: formValues.cliente?.id,
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

    search(): void {
        this.paginator.pageIndex = 0;
        this.paginator.page.emit();
    }

    formatEstado(estado: string): string {
        if (!estado) return '';
        return estado.replace(/_/g, ' ');
    }

    getEstadoClass(estado: string): string {
        if (!estado) return 'bg-gray-100 text-gray-800';
        const est = estado.trim().toUpperCase();

        switch (est) {
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800';
            case 'EN_PROCESO':
            case 'EN PROCESO':
                return 'bg-blue-100 text-blue-800';
            case 'PRODUCIDA':
                return 'bg-indigo-100 text-indigo-800';
            case 'FABRICADA':
                return 'bg-purple-100 text-purple-800';
            case 'INGRESADA':
                return 'bg-gray-100 text-gray-800';
            case 'FINALIZADA':
                return 'bg-green-100 text-green-800';
            case 'CANCELADA':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    limpiarFiltros(): void {
        this.searchForm.reset();
        this.search();
    }

    viewOrdenCompra(element: IOrdenCompra): void {
        this._router.navigate(['/orden-compra/view', element.id]);
    }

    editOrdenCompra(element: IOrdenCompra): void {
        this._router.navigate(['/orden-compra/edit', element.id]);
    }

    openObservacionesModal(element: IOrdenCompra): void {
        this.dialog.open(GenericModalComponent, {
            width: '500px',
            data: {
                title: `Observaciones - ${element.comprobante}`,
                message: this._sanitizer.bypassSecurityTrustHtml(`<div class="p-3 bg-gray-50 border border-gray-100 rounded-lg"><p style="white-space: pre-wrap;">${element.observaciones}</p></div>`),
                type: 'info',
                showConfirmButton: true,
                confirmButtonText: 'Cerrar'
            }
        });
    }

    cancelOrdenCompra(element: IOrdenCompra): void {
        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            autoFocus: false,
            data: {
                title: 'Cancelar Orden',
                message: `¿Está seguro de que desea cancelar la orden <strong>${element.comprobante}</strong>?`,
                icon: 'x-circle',
                type: 'warning',
                showConfirmButton: true,
                confirmButtonText: 'Confirmar',
                showCloseButton: true,
                cancelButtonText: 'Volver',
                customComponent: OrdenCompraCancelModalComponent,
                componentData: {
                    comprobante: element.comprobante,
                    id: element.id
                }
            }
        });

        dialogRef.afterClosed().subscribe(observaciones => {
            if (observaciones) {
                this.isLoading = true;
                this._ordenCompraService.cancelOrdenCompra(element.id, observaciones).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Orden cancelada correctamente.');
                        this.search();
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this._notificationService.showError(err.error?.message || 'Error al cancelar la orden.');
                    }
                });
            }
        });
    }

    deleteOrdenCompra(element: IOrdenCompra): void {
        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Eliminar Orden',
                message: `¿Está seguro de que desea eliminar la orden <strong>${element.comprobante}</strong>? Esta acción no se puede deshacer y se perderán todos los datos.`,
                showConfirmButton: true,
                icon: 'trash',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.isLoading = true;
                this._ordenCompraService.deleteOrdenCompra(element.id).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Orden eliminada correctamente.');
                        this.search();
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this._notificationService.showError(err.error?.message || 'Error al eliminar la orden.');
                    }
                });
            }
        });
    }

    generarOFFromGrid(element: IOrdenCompra): void {
        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '450px',
            data: {
                title: 'Confirmar Generación de OF',
                message: 'Se van a generar ordenes de fabricacion por cada una de las entregas solicitadas de las piezas. Luego de generar las ordenes de fabricación no será posible modificar la orden de compra. ¿Desea continuar?',
                showConfirmButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.isLoading = true;
                this._ordenCompraService.generarOrdenFabrica(element.id).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Orden de Fabricación generada correctamente.');
                        this.search();
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this._notificationService.showError(err.error?.message || 'Error al generar la orden de fabricación.');
                    }
                });
            }
        });
    }

    downloadArchivo(element: IOrdenCompra): void {
        this._ordenCompraService.getArchivoOrdenCompra(element.id).subscribe(res => {
            const byteCharacters = atob(res.data.archivoContenido);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            FileSaver.saveAs(blob, res.data.archivoNombre);
        });
    }

    displayFn(cliente: Cliente): string {
        return cliente?.nombre || '';
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
}