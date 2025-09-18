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
            valor: [null, [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
            fecha: [new Date(), Validators.required],
            observaciones: ['']
        });
    }

    ngOnInit(): void {
        this.loadClientesDropdown();
        this.setupPiezasAutocomplete();
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

            const fechaSeleccionada: Date = formValue.fecha;
         const fechaFormateada = fechaSeleccionada.toISOString().split('T')[0];

        const dto: ICotizacionCreateDTO = {
            idCliente: formValue.cliente.id,
            idPieza: formValue.pieza.id,
            valor: formValue.valor,
            fecha: fechaFormateada,
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
                this._notificationService.showError('Ocurrió un error al guardar la cotización.');
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