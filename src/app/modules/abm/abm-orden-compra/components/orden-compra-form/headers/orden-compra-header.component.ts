import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { AbmTransportesService } from 'app/modules/abm/abm-transportes/abm-transportes.service';
import { NotificationService } from 'app/shared/services/notification.service';

@Component({
    selector: 'app-orden-compra-header',
    templateUrl: './orden-compra-header.component.html'
})
export class OrdenCompraHeaderComponent implements OnInit, OnDestroy {
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) clienteAutocompleteTrigger: MatAutocompleteTrigger;

    @Input() form: FormGroup;
    @Input() mode: 'create' | 'view' | 'edit' = 'create';
    @Input() isInitialLoading: boolean = false;
    
    @Output() fileSelectedEvent = new EventEmitter<File>();

    clientes: any[] = [];
    transportes: any[] = [];
    domicilios: any[] = [];
    mediosEnvioDisponibles: string[] = [];
    filteredClientes$: Observable<any[]>;
    selectedFile: File | null = null;

    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _clientesService: ClientesService,
        private _transportesService: AbmTransportesService,
        private _notification: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadClientes();
        this.loadTransportes();
        this.setupObservers();
    }

    private setupObservers(): void {
        this.filteredClientes$ = this.form.get('cliente').valueChanges.pipe(
            startWith(''),
            map(val => this._filter(val, this.clientes))
        );

        this.form.get('cliente').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(cliente => {
            if (cliente?.id) {
                this.loadDomicilios(cliente.id);
            } else {
                this.domicilios = [];
                this.form.patchValue({ idDomicilioEnvio: null });
            }
        });

        this.form.get('tipoDespacho').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(tipo => {
            if (!this.isInitialLoading) {
                this.form.patchValue({
                    idEmpresaTransporte: null,
                    idDomicilioEnvio: null,
                    mediosEnvio: []
                }, { emitEvent: false });
            }

            this.form.get('idEmpresaTransporte').clearValidators();
            this.form.get('idDomicilioEnvio').clearValidators();
            
            if (tipo === 'RETIRO_TRANSPORTE') {
                this.form.get('idEmpresaTransporte').setValidators([Validators.required]);
            } else if (tipo === 'ENVIO') {
                this.form.get('idDomicilioEnvio').setValidators([Validators.required]);
            }
            
            this.form.get('idEmpresaTransporte').updateValueAndValidity();
            this.form.get('idDomicilioEnvio').updateValueAndValidity();
        });

        this.form.get('idEmpresaTransporte').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(id => {
            const transporte = this.transportes.find(t => t.id === id);
            this.mediosEnvioDisponibles = transporte?.mediosEnvio || [];
            if (!this.isInitialLoading) {
                this.form.patchValue({ mediosEnvio: [] });
            }
        });
    }

    loadClientes(): void {
        this._clientesService.getClientes().subscribe(res => this.clientes = res.data || []);
    }

    loadTransportes(): void {
        this._transportesService.getTransportes({ rows: 100 }).subscribe(res => {
            this.transportes = res.data?.page || [];
            const currentId = this.form.get('idEmpresaTransporte').value;
            if (currentId) {
                const transporte = this.transportes.find(t => t.id === currentId);
                this.mediosEnvioDisponibles = transporte?.mediosEnvio || [];
            }
        });
    }

    loadDomicilios(idCliente: number): void {
        this._clientesService.getDomicilios(idCliente).subscribe(res => {
            this.domicilios = (res.data || []).filter(d => d.tipo === 'EXPEDICION');
        });
    }

    onMedioEnvioToggle(medio: string, checked: boolean): void {
        const current = this.form.get('mediosEnvio').value as string[];
        if (checked) {
            this.form.get('mediosEnvio').setValue([...current, medio]);
        } else {
            this.form.get('mediosEnvio').setValue(current.filter(m => m !== medio));
        }
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                this.selectedFile = file;
                this.fileSelectedEvent.emit(file);
            } else {
                this._notification.showError("Solo PDF o Imágenes");
            }
        }
    }

    clearClientSelection(): void {
        this.form.get('cliente').setValue('');
    }

    displayFn(i: any): string {
        return i ? (i.nombre || i.denominacion) : '';
    }

    private _filter(val: any, list: any[]): any[] {
        const str = (typeof val === 'string' ? val : (val?.nombre || val?.denominacion || '')).toLowerCase();
        return list.filter(i => (i.nombre || i.denominacion || i.codigo || '').toLowerCase().includes(str));
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
