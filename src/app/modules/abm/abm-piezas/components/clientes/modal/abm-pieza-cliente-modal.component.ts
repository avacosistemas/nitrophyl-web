import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientesService } from 'app/shared/services/clientes.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { Subscription, Observable, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PiezaCliente } from '../../../models/pieza.model';
import { ABMPiezaService } from '../../../abm-piezas.service';
import { DatePipe } from '@angular/common';

interface Cliente {
    id: number;
    nombre: string;
    codigo?: string;
}

@Component({
    selector: 'app-abm-pieza-cliente-modal',
    templateUrl: './abm-pieza-cliente-modal.component.html',
    styles: [`
        .mat-dialog-content { overflow: visible !important; }
    `],
    providers: [DatePipe]
})
export class ABMPiezaClienteModalComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isLoading: boolean = false;
    isEditMode: boolean = false;
    clientesDisponibles: Cliente[] = [];
    filteredClientes$: Observable<Cliente[]>;

    private subscription: Subscription = new Subscription();

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<ABMPiezaClienteModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { piezaId: number, clienteAsociado?: PiezaCliente },
        private _clients: ClientesService,
        private _piezaService: ABMPiezaService,
        private notificationService: NotificationService,
        private datePipe: DatePipe,
    ) {
        this.form = this.fb.group({
            cliente: [null, Validators.required],
            nombrePiezaPersonalizado: [''],
            cotizacion: [null, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')],
            fechaCotizacion: [null],
            observacionesCotizacion: [{ value: '', disabled: true }]
        });
    }

    ngOnInit(): void {
        this.isEditMode = !!this.data.clienteAsociado;
        this.loadClientes();
        this.setupValidationLogic();

        if (this.isEditMode) {
            this.patchForm();
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private loadClientes(): void {
        this.subscription.add(
            this._clients.getClientes().subscribe({
                next: (res: any) => {
                    this.clientesDisponibles = res?.data || [];
                    this.filteredClientes$ = this.form.get('cliente').valueChanges.pipe(
                        startWith(this.isEditMode && this.data.clienteAsociado ? this.data.clienteAsociado.nombreCliente : ''),
                        map(value => this._filterClientes(value))
                    );

                    if (this.isEditMode && this.data.clienteAsociado) {
                        const clienteObj = this.clientesDisponibles.find(c => c.id === this.data.clienteAsociado.idCliente);
                        if (clienteObj) {
                            this.form.patchValue({ cliente: clienteObj }, { emitEvent: false });
                            this.form.get('cliente').disable();
                            this.form.get('cotizacion').disable();
                            this.form.get('fechaCotizacion').disable();
                            this.form.get('observacionesCotizacion').disable();
                        }
                    }
                },
                error: (err) => {
                    const res = err.error;

                    if (res && res.status === 'VALIDATIONS_ERRORS') {
                        const msg = res.message || res.error || (res.errors ? 'Error en validación de datos' : null);

                        if (msg) {
                            this.notificationService.showError(msg);
                        } else {
                            this.notificationService.showError('No se pudieron validar los datos del cliente.');
                        }
                    } else {
                        this.notificationService.showError('Error al cargar clientes.');
                    }
                }
            })
        );
    }

    private patchForm(): void {
        const data = this.data.clienteAsociado;
        this.form.patchValue({
            nombrePiezaPersonalizado: data.nombrePiezaPersonalizado,
            cotizacion: data.cotizacion,
            fechaCotizacion: data.fechaCotizacion ? this.datePipe.transform(data.fechaCotizacion, 'dd/MM/yyyy') : null,
            observacionesCotizacion: data.observacionesCotizacion
        });

        this.form.get('cotizacion').updateValueAndValidity();
        this.form.get('fechaCotizacion').updateValueAndValidity();
    }

    private setupValidationLogic(): void {
        const cotCtrl = this.form.get('cotizacion');
        const fecCtrl = this.form.get('fechaCotizacion');
        const obsCtrl = this.form.get('observacionesCotizacion');

        this.subscription.add(
            merge(cotCtrl.valueChanges, fecCtrl.valueChanges).subscribe(() => {
                const hasCot = !!cotCtrl.value;
                const hasFec = !!fecCtrl.value;

                if (hasCot && !fecCtrl.hasValidator(Validators.required)) {
                    fecCtrl.setValidators([Validators.required]);
                    fecCtrl.updateValueAndValidity({ emitEvent: false });
                } else if (!hasCot && fecCtrl.hasValidator(Validators.required)) {
                    fecCtrl.clearValidators();
                    fecCtrl.updateValueAndValidity({ emitEvent: false });
                }

                if (hasFec && !cotCtrl.hasValidator(Validators.required)) {
                    cotCtrl.setValidators([Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]);
                    cotCtrl.updateValueAndValidity({ emitEvent: false });
                } else if (!hasFec && cotCtrl.hasValidator(Validators.required)) {
                    cotCtrl.setValidators([Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]);
                    cotCtrl.updateValueAndValidity({ emitEvent: false });
                }

                if (hasCot && hasFec && cotCtrl.valid && fecCtrl.valid) {
                    if (obsCtrl.disabled) obsCtrl.enable({ emitEvent: false });
                } else {
                    if (obsCtrl.enabled) {
                        obsCtrl.disable({ emitEvent: false });
                        obsCtrl.setValue('', { emitEvent: false });
                    }
                }
            })
        );
    }

    save(): void {
        if (this.form.invalid) return;

        this.isLoading = true;
        const formValue = this.form.getRawValue();

        let fechaISO = null;
        if (formValue.fechaCotizacion) {
            fechaISO = this.datePipe.transform(formValue.fechaCotizacion, 'dd/MM/yyyy');
        }

        const dto: any = {
            idCliente: formValue.cliente.id,
            idPieza: this.data.piezaId,
            nombrePiezaPersonalizado: formValue.nombrePiezaPersonalizado,
            cotizacion: formValue.cotizacion,
            fechaCotizacion: fechaISO,
            observacionesCotizacion: formValue.observacionesCotizacion
        };

        let request$: Observable<any>;

        if (this.isEditMode) {
            request$ = this._piezaService.actualizarClienteDePieza(this.data.clienteAsociado.id, dto);
        } else {
            request$ = this._piezaService.agregarClienteAPieza(dto);
        }

        this.subscription.add(
            request$.subscribe({
                next: () => {
                    this.notificationService.showSuccess(`Cliente ${this.isEditMode ? 'actualizado' : 'agregado'} correctamente.`);
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.isLoading = false;

                    const res = err.error;

                    if (res && res.status === 'VALIDATIONS_ERRORS') {
                        if (res.message) {
                            this.notificationService.showError(res.message);
                        }
                        else if (res.errors) {
                            const errorMsg = typeof res.errors === 'string'
                                ? res.errors
                                : 'Verifique los campos ingresados (errores múltiples).';
                            this.notificationService.showError(errorMsg);
                        }
                        else if (res.error) {
                            this.notificationService.showError(res.error);
                        }
                        else {
                            this.notificationService.showError('Error de validación. Por favor verifique los datos.');
                        }
                    } else {
                        this.notificationService.showError('Error al guardar los datos.');
                    }
                }
            })
        );
    }

    close(): void {
        this.dialogRef.close(false);
    }

    displayCliente(cliente: Cliente): string {
        return cliente && cliente.nombre ? cliente.nombre : '';
    }

    private _filterClientes(value: string | Cliente): Cliente[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        if (!filterValue) return this.clientesDisponibles;
        return this.clientesDisponibles.filter(cliente =>
            cliente.nombre.toLowerCase().includes(filterValue) ||
            (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
        );
    }
}