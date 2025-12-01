import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { NotificationService } from 'app/shared/services/notification.service';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil, debounceTime } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { CotizacionesService } from '../../cotizaciones.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { ICotizacionCreateDTO } from '../../models/cotizacion.model';
import * as moment from 'moment';

interface Cliente {
    id: number;
    nombre: string;
    codigo?: string;
}
@Component({
    selector: 'app-cotizacion-modal',
    templateUrl: './cotizacion-modal.component.html',
    styleUrls: ['./cotizacion-modal.component.scss']
})
export class CotizacionModalComponent implements OnInit, OnDestroy {

    form: FormGroup;
    isLoading = false;
    filteredPiezas$: Observable<any[]>;
    clientesDisponibles: Cliente[] = [];
    filteredClientes$: Observable<Cliente[]>;
    piezasCliente: any[] = [];

    private _destroying$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<CotizacionModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _fb: FormBuilder,
        private _dialog: MatDialog,
        private _sanitizer: DomSanitizer,
        private _notificationService: NotificationService,
        private _cotizacionesService: CotizacionesService,
        private _clientesService: ClientesService,
        private _abmPiezasService: ABMPiezaService
    ) {
        this.form = this._fb.group({
            pieza: [null, Validators.required],
            cliente: [null, Validators.required],
            soloPiezasCliente: [false],
            valor: [null, [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
            fecha: [new Date(), Validators.required],
            observaciones: ['']
        });
    }

    ngOnInit(): void {
        this.loadClientesDropdown();
        this.setupPiezasAutocomplete();
        this.setupClienteLogic();
    }

    ngOnDestroy(): void {
        this._destroying$.next();
        this._destroying$.complete();
    }

    loadClientesDropdown(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res: any) => {
                this.clientesDisponibles = res?.data || [];
                this.filteredClientes$ = this.form.get('cliente').valueChanges.pipe(
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

    setupClienteLogic(): void {
        this.form.get('cliente').valueChanges
            .pipe(takeUntil(this._destroying$))
            .subscribe(cliente => {
                if (this.form.get('soloPiezasCliente').value && cliente?.id) {
                    this.loadPiezasByCliente(cliente.id);
                    this.form.get('pieza').setValue(null);
                }
                else if (!cliente?.id) {
                    this.piezasCliente = [];
                    if (this.form.get('soloPiezasCliente').value) {
                        this.form.get('soloPiezasCliente').setValue(false);
                    }
                }
            });

        this.form.get('soloPiezasCliente').valueChanges
            .pipe(takeUntil(this._destroying$))
            .subscribe(checked => {
                this.form.get('pieza').setValue(null);

                if (checked) {
                    const cliente = this.form.get('cliente').value;
                    if (cliente?.id) {
                        this.loadPiezasByCliente(cliente.id);
                    } else {
                        this._notificationService.showError('Debe seleccionar un cliente primero.');
                        this.form.get('soloPiezasCliente').setValue(false, { emitEvent: false });
                    }
                }
            });
    }

    loadPiezasByCliente(idCliente: number): void {
        this.isLoading = true;
        this._cotizacionesService.getPiezasCliente(idCliente)
            .pipe(takeUntil(this._destroying$))
            .subscribe({
                next: (res: any) => {
                    this.piezasCliente = res?.data || [];
                    this.isLoading = false;
                    this.form.get('pieza').updateValueAndValidity({ onlySelf: true, emitEvent: true });
                },
                error: (err) => {
                    console.error('Error cargando piezas del cliente', err);
                    this.isLoading = false;
                    this._notificationService.showError('Error al cargar las piezas del cliente.');
                    this.form.get('soloPiezasCliente').setValue(false);
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
        this.filteredPiezas$ = this.form.get('pieza').valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            switchMap(value => {
                const isRestricted = this.form.get('soloPiezasCliente').value;
                const searchTerm = typeof value === 'string' ? value : value?.denominacion;

                if (isRestricted) {
                    return of(this._filterLocalPiezas(searchTerm));
                } else {
                    if (typeof value === 'object' && value !== null) {
                        return of([]);
                    }
                    return this._abmPiezasService.getPiezas({ nombre: searchTerm || '', rows: 50, soloVigentes: true }).pipe(
                        map(res => res.data.page),
                        catchError(() => of([]))
                    );
                }
            })
        );
    }

    private _filterLocalPiezas(term: string): any[] {
        if (!term) return this.piezasCliente;
        const filterValue = term.toLowerCase();
        return this.piezasCliente.filter(pieza =>
            (pieza.denominacion && pieza.denominacion.toLowerCase().includes(filterValue)) ||
            (pieza.codigo && pieza.codigo.toLowerCase().includes(filterValue))
        );
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this._notificationService.showError('Por favor complete todos los campos requeridos.');
            return;
        }

        const pieza = this.form.get('pieza').value;
        const cliente = this.form.get('cliente').value;

        const message = this._sanitizer.bypassSecurityTrustHtml(
            `Está a punto de asignar el precio de la pieza <b>${pieza.denominacion}</b> para el cliente <b>${cliente.nombre}</b>. Esto impactará a partir de las próximas cotizaciones para la facturación. ¿Está seguro?`
        );

        const dialogRef = this._dialog.open(GenericModalComponent, {
            width: '450px',
            data: {
                title: 'Confirmar Cotización',
                message: message,
                showConfirmButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.createCotizacion();
            }
        });
    }

    private createCotizacion(): void {
        this.isLoading = true;
        const formValue = this.form.getRawValue();

        const fechaSeleccionada = moment(formValue.fecha);
        const fechaParaAPI = fechaSeleccionada.format('DD/MM/YYYY');

        const dto: ICotizacionCreateDTO = {
            idCliente: formValue.cliente.id,
            idPieza: formValue.pieza.id,
            valor: formValue.valor,
            fecha: fechaParaAPI,
            observaciones: formValue.observaciones
        };

        this._cotizacionesService.createCotizacion(dto).subscribe({
            next: () => {
                this.isLoading = false;
                this._notificationService.showSuccess('Cotización guardada correctamente.');
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.isLoading = false;
                const errorMessage = err?.error?.message || 'Ocurrió un error al guardar la cotización.';
                this._notificationService.showError(errorMessage);
                console.error(err);
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    displayFn(item: any): string {
        if (!item) { return ''; }
        return item.codigo ? `${item.codigo} - ${item.denominacion || item.nombre}` : (item.denominacion || item.nombre);
    }

    displayCliente(cliente: Cliente): string {
        return cliente && cliente.nombre ? cliente.nombre : '';
    }
}