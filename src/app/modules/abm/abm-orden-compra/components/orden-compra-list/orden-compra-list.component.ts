import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { ClientesService } from 'app/shared/services/clientes.service';
import { Cliente } from 'app/shared/models/cliente.model';
import { PDFModalDialogComponent } from 'app/modules/prompts/pdf-modal/pdf-modal.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
    selector: 'app-orden-compra-list',
    templateUrl: './orden-compra-list.component.html',
})
export class OrdenCompraListComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) clienteAutocompleteTrigger: MatAutocompleteTrigger;

    isLoading = true;
    dataSource = new MatTableDataSource<IOrdenCompra>([]);
    displayedColumns: string[] = ['fecha', 'clienteNombre', 'nroComprobante', 'nroInterno', 'archivo'];
    totalReg: number = 0;

    searchForm: FormGroup;
    clientes: Cliente[] = [];
    filteredClientes$: Observable<Cliente[]>;

    private _destroying$ = new Subject<void>();

    constructor(
        private _ordenCompraService: AbmOrdenCompraService,
        private _clientesService: ClientesService,
        public dialog: MatDialog,
        private _notificationService: NotificationService,
        private _sanitizer: DomSanitizer,
        private _fb: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.searchForm = this._fb.group({
            cliente: [null],
            fechaDesde: [null],
            fechaHasta: [null],
            searchText: ['']
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
        const params: any = {
            first: this.paginator.pageIndex * this.paginator.pageSize,
            rows: this.paginator.pageSize,
            asc: this.sort.direction !== 'desc',
            idx: this.sort.active || 'fecha',
            idCliente: formValues.cliente?.id,
            fechaDesde: formValues.fechaDesde ? new Date(formValues.fechaDesde).toLocaleDateString('en-GB') : null,
            fechaHasta: formValues.fechaHasta ? new Date(formValues.fechaHasta).toLocaleDateString('en-GB') : null,
            busqueda: formValues.searchText
        };
        return params;
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

    limpiarFiltros(): void {
        this.searchForm.reset();
        this.search();
    }

    previewArchivo(element: IOrdenCompra): void {
        this._ordenCompraService.downloadArchivo(element.id).subscribe(res => {
            const base64Pdf = res.data.archivoContenido;
            this.dialog.open(PDFModalDialogComponent, {
                width: '80vw',
                height: '90vh',
                data: { src: base64Pdf, title: res.data.archivoNombre, showDownloadButton: true }
            });
        });
    }

    downloadArchivo(element: IOrdenCompra): void {
        this._ordenCompraService.downloadArchivo(element.id).subscribe(res => {
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