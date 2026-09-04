import { Component, Inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { Pieza, PiezaClonarDTO } from '../../../models/pieza.model';
import { ABMPiezaService } from '../../../abm-piezas.service';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { MaterialsService } from 'app/modules/abm/abm-formula/materials.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';
import { RevisionInicialInputComponent } from '../../crear-editar/revision-inicial-input.component';

interface Cliente {
    id: number;
    nombre: string;
    codigo?: string;
}

interface Material {
    id: number;
    nombre: string;
    codigo?: string;
}

@Component({
    selector: 'app-abm-pieza-clonar-modal',
    templateUrl: './abm-pieza-clonar-modal.component.html',
    styleUrls: ['./abm-pieza-clonar-modal.component.scss'],
    providers: [DatePipe]
})
export class ABMPiezaClonarModalComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isLoading: boolean = false;
    clientesDisponibles: Cliente[] = [];
    materialesDisponibles: Material[] = [];

    filteredClientes$: Observable<Cliente[]>;
    filteredMaterials$: Observable<Material[]>;

    private _destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<ABMPiezaClonarModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { pieza: Pieza },
        private _piezaService: ABMPiezaService,
        private _clientesService: ClientesService,
        private _materialsService: MaterialsService,
        private notificationService: NotificationService,
        private dialog: MatDialog,
        private datePipe: DatePipe
    ) {
        const p = this.data.pieza;
        this.form = this.fb.group({
            codigo: [p ? p.codigo : '', Validators.required],
            material: [null],
            nombre: [p ? p.denominacion : '', Validators.required],
            cliente: [null, Validators.required],
            cotizacion: [null, Validators.pattern('^[0-9]+(\\.[0-9]{1,3})?$')],
            fechaCotizacion: [null],
            observacionesCotizacion: [''],
            hojaProceso: [''],
            espesoresPesoCrudo: [false],
            moldes: [false],
            insumos: [false],
            moldeo: [false],
            prensas: [false],
            desmoldantePostcura: [false],
            esquema: [false],
            piezaTerminada: [false],
            controles: [false],
            planos: [false]
        });
    }

    ngOnInit(): void {
        this.loadClientes();
        this.loadMateriales();
        this.setupCotizacionValidation();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    private loadClientes(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroy$)).subscribe({
            next: (res: any) => {
                this.clientesDisponibles = res?.data || [];
                this.filteredClientes$ = this.form.get('cliente').valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterClientes(value))
                );
            },
            error: (err) => {
                console.error('Error al cargar clientes:', err);
                this.notificationService.showError('Error al cargar la lista de clientes.');
            }
        });
    }

    private loadMateriales(): void {
        this._materialsService.get().pipe(takeUntil(this._destroy$)).subscribe({
            next: (res: any) => {
                const list = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                this.materialesDisponibles = list;

                const materialName = this.data.pieza?.material;
                if (materialName) {
                    const match = this.materialesDisponibles.find(
                        m => (m.nombre && m.nombre.trim().toLowerCase() === materialName.trim().toLowerCase()) ||
                             (m.codigo && m.codigo.trim().toLowerCase() === materialName.trim().toLowerCase())
                    );
                    if (match) {
                        this.form.patchValue({ material: match });
                    } else {
                        this.form.patchValue({ material: materialName });
                    }
                }

                this.filteredMaterials$ = this.form.get('material').valueChanges.pipe(
                    startWith(this.form.get('material').value || ''),
                    map(value => this._filterMateriales(value))
                );
            },
            error: (err) => {
                console.error('Error al cargar materiales:', err);
                this.notificationService.showError('Error al cargar la lista de materiales.');
            }
        });
    }

    private setupCotizacionValidation(): void {
        const cotCtrl = this.form.get('cotizacion');
        const fecCtrl = this.form.get('fechaCotizacion');

        merge(cotCtrl.valueChanges, fecCtrl.valueChanges)
            .pipe(takeUntil(this._destroy$))
            .subscribe(() => {
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
                    cotCtrl.setValidators([Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,3})?$')]);
                    cotCtrl.updateValueAndValidity({ emitEvent: false });
                } else if (!hasFec && cotCtrl.hasValidator(Validators.required)) {
                    cotCtrl.setValidators([Validators.pattern('^[0-9]+(\\.[0-9]{1,3})?$')]);
                    cotCtrl.updateValueAndValidity({ emitEvent: false });
                }
            });
    }

    private _filterClientes(value: string | Cliente): Cliente[] {
        if (!value) return this.clientesDisponibles;
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.clientesDisponibles.filter(cliente =>
            cliente.nombre.toLowerCase().includes(filterValue) ||
            (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
        );
    }

    private _filterMateriales(value: string | Material): Material[] {
        if (!value) return this.materialesDisponibles;
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.materialesDisponibles.filter(m =>
            (m.nombre && m.nombre.toLowerCase().includes(filterValue)) ||
            (m.codigo && m.codigo.toLowerCase().includes(filterValue))
        );
    }

    displayCliente(cliente: Cliente): string {
        return cliente && cliente.nombre ? cliente.nombre : '';
    }

    displayMaterial(mat: any): string {
        if (!mat) return '';
        if (typeof mat === 'string') return mat;
        return mat.nombre || '';
    }

    clearMaterialInput(): void {
        this.form.get('material')?.setValue(null);
    }

    get isAnyCheckSelected(): boolean {
        const v = this.form.value;
        return !!(
            v.espesoresPesoCrudo ||
            v.moldes ||
            v.insumos ||
            v.moldeo ||
            v.prensas ||
            v.desmoldantePostcura ||
            v.esquema ||
            v.piezaTerminada ||
            v.controles ||
            v.planos
        );
    }

    setAllChecks(value: boolean): void {
        this.form.patchValue({
            espesoresPesoCrudo: value,
            moldes: value,
            insumos: value,
            moldeo: value,
            prensas: value,
            desmoldantePostcura: value,
            esquema: value,
            piezaTerminada: value,
            controles: value,
            planos: value
        });
    }

    cancelar(): void {
        this.dialogRef.close({ success: false });
    }

    onGuardar(continuar: boolean): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Revisión inicial',
                message: 'Introduzca un número de revisión inicial con la que quiere empezar.',
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                type: 'info',
                customComponent: RevisionInicialInputComponent,
                componentData: { initialRevision: 0 }
            }
        });

        dialogRef.afterClosed().pipe(takeUntil(this._destroy$)).subscribe(result => {
            if (result === false || result === undefined || result === null) {
                return;
            }

            let finalRevision: number | null = null;
            if (typeof result === 'object' && 'initialRevision' in result) {
                const parsed = Number(result.initialRevision);
                if (!isNaN(parsed)) {
                    finalRevision = parsed;
                }
            } else if (typeof result === 'number') {
                finalRevision = result;
            }

            if (finalRevision === null) {
                this.notificationService.showError('Revisión inicial no proporcionada o inválida.');
                return;
            }

            this.ejecutarClonado(finalRevision, continuar);
        });
    }

    private ejecutarClonado(revisionInicial: number, continuar: boolean): void {
        this.isLoading = true;
        const formVal = this.form.getRawValue();
        const materialVal = formVal.material;

        let fechaISO: string | null = null;
        if (formVal.fechaCotizacion) {
            fechaISO = this.datePipe.transform(formVal.fechaCotizacion, 'dd/MM/yyyy');
        }

        const dto: PiezaClonarDTO = {
            idPiezaOriginal: this.data.pieza.id,
            codigo: formVal.codigo,
            nombre: formVal.nombre,
            idMaterial: (materialVal && typeof materialVal === 'object') ? materialVal.id : null,
            material: (materialVal && typeof materialVal === 'object') ? materialVal.nombre : (typeof materialVal === 'string' ? materialVal : null),
            idCliente: formVal.cliente ? formVal.cliente.id : null,
            cotizacion: formVal.cotizacion !== null && formVal.cotizacion !== '' ? Number(formVal.cotizacion) : null,
            fechaCotizacion: fechaISO,
            observacionesCotizacion: formVal.observacionesCotizacion || null,
            hojaProceso: formVal.hojaProceso || null,
            revisionInicial: revisionInicial,
            espesoresPesoCrudo: !!formVal.espesoresPesoCrudo,
            moldes: !!formVal.moldes,
            insumos: !!formVal.insumos,
            moldeo: !!formVal.moldeo,
            prensas: !!formVal.prensas,
            desmoldantePostcura: !!formVal.desmoldantePostcura,
            esquema: !!formVal.esquema,
            piezaTerminada: !!formVal.piezaTerminada,
            controles: !!formVal.controles,
            planos: !!formVal.planos
        };

        this._piezaService.copiarPiezaNueva(dto).pipe(takeUntil(this._destroy$)).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.notificationService.showSuccess('Pieza clonada exitosamente.');
                const newPiezaId = res?.data?.id || res?.data || res?.id;
                this.dialogRef.close({
                    success: true,
                    continuar: continuar,
                    newPiezaId: newPiezaId
                });
            },
            error: (err: any) => {
                this.isLoading = false;
                console.error('Error al clonar pieza:', err);
                const res = err?.error;
                if (res && res.status === 'VALIDATIONS_ERRORS') {
                    const msg = res.message || res.error || (res.errors ? 'Error en validación de datos' : null);
                    this.notificationService.showError(msg || 'Error de validación al clonar pieza.');
                } else if (res && res.message) {
                    this.notificationService.showError(res.message);
                } else {
                    this.notificationService.showError('Error al clonar la pieza.');
                }
            }
        });
    }
}
