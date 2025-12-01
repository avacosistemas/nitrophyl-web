import {
    Component,
    OnInit,
    Input,
    OnDestroy,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { PiezaProceso, PiezaCreateDTO, PiezaUpdateDTO, Molde, Espesor } from '../../models/pieza.model';
import { Observable, of, combineLatest, forkJoin, throwError, merge } from 'rxjs';
import { map, startWith, catchError, debounceTime, switchMap, filter } from 'rxjs/operators';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { FormulasService } from 'app/shared/services/formulas.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { RevisionInicialInputComponent } from './revision-inicial-input.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatTableDataSource } from '@angular/material/table';

interface ForkJoinResults {
    tiposPieza: { id: number; nombre: string; }[];
    formulasResponse: { data: { id: number; nombre: string; durezaMinima?: number; durezaMaxima?: number; unidadDureza?: string; }[] };
    clientesResponse: { data: { id: number; nombre: string; codigo?: string; }[] };
    pieza: PiezaProceso | null;
}

@Component({
    selector: 'app-abm-pieza-crear-editar',
    templateUrl: './abm-pieza-crear-editar.component.html',
    styleUrls: ['./abm-pieza-crear-editar.component.scss'],
})
export class ABMPiezaCrearEditarComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
    @Input() piezaId: number | null = null;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    piezaForm: FormGroup;
    espesorForm: FormGroup;
    espesoresDataSource = new MatTableDataSource<Espesor>([]);
    displayedColumnsEspesores: string[] = ['min', 'max', 'acciones'];

    pieceNames$: Observable<string[]>;
    tiposPieza$: Observable<{ id: number; nombre: string }[]>;
    formulas$: Observable<{ id: number; nombre: string; durezaMinima?: number; durezaMaxima?: number; unidadDureza?: string; }[]>;
    clientes$: Observable<{ id: number; nombre: string; codigo?: string }[]>;

    filteredTiposPieza$: Observable<{ id: number; nombre: string }[]>;
    filteredFormulas$: Observable<{ id: number; nombre: string }[]>;
    filteredClientes$: Observable<{ id: number; nombre: string; codigo?: string }[]>;
    filteredMoldes$: Observable<Molde[]>;

    tiposDurezaOptions: { value: string; label: string }[] = [
        { value: 'SHORE_A', label: 'Shore A' },
        { value: 'SHORE_D', label: 'Shore D' },
    ];

    clasificacionOptions = [
        { value: 'NITROPHYL', label: 'Nitrophyl' },
        { value: 'CLIENTE', label: 'Cliente' }
    ];

    selectedFile: File | null = null;
    pieza: PiezaProceso;
    private initialRevision: number = 0;

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private notificationService: NotificationService,
        public dialog: MatDialog,
        private sanitizer: DomSanitizer,
        private formulasService: FormulasService,
        private clientesService: ClientesService
    ) {
        super(fb, router, route, abmPiezaService, dialog);

        this.piezaForm = this.fb.group({
            codigo: [{ value: null, disabled: false }],
            nombre: [{ value: null, disabled: false }, Validators.required],
            idTipoPieza: [{ value: null, disabled: false }, Validators.required],
            idFormula: [{ value: null, disabled: false }, Validators.required],
            durezaMinima: [{ value: null, disabled: false }, Validators.required],
            durezaMaxima: [{ value: null, disabled: false }, Validators.required],
            unidadDureza: [{ value: 'SHORE_A', disabled: false }],
            pesoCrudo: [{ value: null, disabled: false }],
            observacionesPesoCrudo: [{ value: null, disabled: false }],
            idMolde: [{ value: null, disabled: true }],
            observacionesMolde: [{ value: null, disabled: false }],
            idCliente: [{ value: null, disabled: false }],
            nombrePiezaCliente: [{ value: null, disabled: false }],
            cotizacionCliente: [null, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')],
            fechaCotizacionCliente: [null],
            observacionesCotizacionCliente: [{ value: null, disabled: true }],
            revision: [{ value: null, disabled: true }],
            fechaRevision: [{ value: null, disabled: true }],
            observacionesRevision: [{ value: null, disabled: false }],
            hojaProceso: [null, Validators.maxLength(100)],
            plano: this.fb.group({
                sinPlano: [false],
                archivo: [null],
                planoCodigo: [null],
                planoRevision: [null],
                planoClasificacion: [null],
                planoObservaciones: [null],
            }),
        });

        this.setupCotizacionValidation();

        this.espesorForm = this.fb.group({
            min: [null, [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
            max: [null, [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]]
        });
    }

    ngOnInit(): void {
        if (this.mode === 'create') {
            this.loadAllData();
        }

        this.filteredMoldes$ = this.piezaForm.get('idTipoPieza').valueChanges.pipe(
            startWith(this.piezaForm.get('idTipoPieza').value),
            switchMap(tipoPieza => {
                const moldeControl = this.piezaForm.get('idMolde');
                const idTipoPieza = tipoPieza ? tipoPieza.id : null;

                if (!idTipoPieza) {
                    moldeControl.reset();
                    moldeControl.disable();
                    return of([]);
                }

                moldeControl.enable();

                return moldeControl.valueChanges.pipe(
                    startWith(''),
                    filter(value => typeof value === 'string'),
                    debounceTime(300),
                    switchMap(searchString => {
                        return this.abmPiezaService.getMoldesCombo(searchString, idTipoPieza).pipe(
                            map(response => response.data || []),
                            catchError(() => of([]))
                        );
                    })
                );
            })
        );

        this.piezaForm.get('idFormula').valueChanges.subscribe(formula => {
            if (formula && typeof formula === 'object' && formula.id) {
                if (formula.durezaMinima !== undefined) {
                    this.piezaForm.patchValue({ durezaMinima: formula.durezaMinima });
                }
                if (formula.durezaMaxima !== undefined) {
                    this.piezaForm.patchValue({ durezaMaxima: formula.durezaMaxima });
                }
                if (formula.unidadDureza) {
                    this.piezaForm.patchValue({ unidadDureza: formula.unidadDureza });
                }
            }
        });

        this.piezaForm.get('plano.sinPlano').valueChanges.subscribe(sinPlano => {
            this.togglePlanoValidators(sinPlano);
        });
    }

    private togglePlanoValidators(sinPlano: boolean): void {
        const archivoCtrl = this.piezaForm.get('plano.archivo');
        const codigoCtrl = this.piezaForm.get('plano.planoCodigo');
        const revisionCtrl = this.piezaForm.get('plano.planoRevision');
        const clasificacionCtrl = this.piezaForm.get('plano.planoClasificacion');
        const observacionesCtrl = this.piezaForm.get('plano.planoObservaciones');

        if (sinPlano) {
            this.removeSelectedFile();

            archivoCtrl.clearValidators();
            codigoCtrl.clearValidators();
            revisionCtrl.clearValidators();
            clasificacionCtrl.clearValidators();

            codigoCtrl.setValue(null);
            revisionCtrl.setValue(null);
            clasificacionCtrl.setValue(null);
            observacionesCtrl.setValue(null);

        } else {
            if (this.mode === 'create') {
                codigoCtrl.setValidators([Validators.required]);
                revisionCtrl.setValidators([Validators.required, Validators.pattern(/^([0-9]+|[a-zA-Z]+)$/)]);
                clasificacionCtrl.setValidators([Validators.required]);
            }
        }

        archivoCtrl.updateValueAndValidity();
        codigoCtrl.updateValueAndValidity();
        revisionCtrl.updateValueAndValidity();
        clasificacionCtrl.updateValueAndValidity();
    }

    private setupCotizacionValidation(): void {
        const cotizacionCtrl = this.piezaForm.get('cotizacionCliente');
        const fechaCtrl = this.piezaForm.get('fechaCotizacionCliente');
        const obsCtrl = this.piezaForm.get('observacionesCotizacionCliente');

        this.subscriptions.push(
            merge(cotizacionCtrl.valueChanges, fechaCtrl.valueChanges)
                .subscribe(() => {
                    const hasCotizacion = !!cotizacionCtrl.value;
                    const hasFecha = !!fechaCtrl.value;

                    if (hasCotizacion || hasFecha) {
                        if (hasCotizacion && !fechaCtrl.hasValidator(Validators.required)) {
                            fechaCtrl.setValidators([Validators.required]);
                            fechaCtrl.updateValueAndValidity({ emitEvent: false });
                        } else if (!hasCotizacion && fechaCtrl.hasValidator(Validators.required)) {
                            fechaCtrl.clearValidators();
                            fechaCtrl.updateValueAndValidity({ emitEvent: false });
                        }

                        if (hasFecha && !cotizacionCtrl.hasValidator(Validators.required)) {
                            cotizacionCtrl.setValidators([Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]);
                            cotizacionCtrl.updateValueAndValidity({ emitEvent: false });
                        } else if (!hasFecha && cotizacionCtrl.hasValidator(Validators.required)) {
                            cotizacionCtrl.setValidators([Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]);
                            cotizacionCtrl.updateValueAndValidity({ emitEvent: false });
                        }
                    } else {
                        if (fechaCtrl.hasValidator(Validators.required)) {
                            fechaCtrl.clearValidators();
                            fechaCtrl.updateValueAndValidity({ emitEvent: false });
                        }

                        if (cotizacionCtrl.hasValidator(Validators.required)) {
                            cotizacionCtrl.setValidators([Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]);
                            cotizacionCtrl.updateValueAndValidity({ emitEvent: false });
                        }
                    }

                    if (hasCotizacion && hasFecha && cotizacionCtrl.valid && fechaCtrl.valid) {
                        if (obsCtrl.disabled) {
                            obsCtrl.enable({ emitEvent: false });
                        }
                    } else {
                        if (obsCtrl.enabled) {
                            obsCtrl.disable({ emitEvent: false });
                            obsCtrl.setValue(null, { emitEvent: false });
                        }
                    }
                })
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode || (changes.piezaId && changes.piezaId.currentValue)) {
            this.updateFormState();
            if (this.piezaId && (this.mode === 'edit' || this.mode === 'view')) {
                this.loadAllData();
            }
        }
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    updateFormState(): void {
        this.setupConditionalValidators();
        if (this.mode === 'view') {
            this.piezaForm.disable();
        } else if (this.mode === 'create') {
            this.piezaForm.enable();
            this.piezaForm.get('idMolde').disable();
            this.piezaForm.get('revision').disable();
            this.piezaForm.get('fechaRevision').disable();
        } else if (this.mode === 'edit') {
            this.piezaForm.enable();
            this.piezaForm.get('codigo').disable();
            this.piezaForm.get('nombre').disable();
            this.piezaForm.get('idTipoPieza').disable();
            this.piezaForm.get('idFormula').disable();
            this.piezaForm.get('revision').disable();
            this.piezaForm.get('fechaRevision').disable();
        }
    }

    setupConditionalValidators(): void {
        if (this.mode === 'create') {
            this.piezaForm.get('codigo').setValidators([Validators.required]);
            this.piezaForm.get('idMolde').setValidators([Validators.required]);
            this.piezaForm.get('idCliente').setValidators([Validators.required]);

            if (!this.piezaForm.get('plano.sinPlano').value) {
                this.piezaForm.get('plano.planoCodigo').setValidators([Validators.required]);
                this.piezaForm.get('plano.planoRevision').setValidators([Validators.required, Validators.pattern(/^([0-9]+|[a-zA-Z]+)$/)]);
                this.piezaForm.get('plano.planoClasificacion').setValidators([Validators.required]);
            }
        } else {
            this.piezaForm.get('codigo').clearValidators();
            this.piezaForm.get('idMolde').clearValidators();
            this.piezaForm.get('idCliente').clearValidators();
            this.piezaForm.get('plano.planoCodigo').clearValidators();
            this.piezaForm.get('plano.planoRevision').clearValidators();
            this.piezaForm.get('plano.planoClasificacion').clearValidators();
        }
        this.piezaForm.updateValueAndValidity();
    }

    loadAllData(): void {
        const dataRequests: { [key: string]: Observable<any> } = {
            tiposPieza: this.abmPiezaService.getPiezaTipo().pipe(catchError(() => of([]))),
            formulasResponse: this.formulasService.get().pipe(catchError(() => of({ data: [] }))),
            clientesResponse: this.clientesService.getClientes().pipe(catchError(() => of({ data: [] }))),
        };

        if (this.piezaId && (this.mode === 'edit' || this.mode === 'view')) {
            dataRequests['pieza'] = this.abmPiezaService.getByIdEdicion(this.piezaId).pipe(catchError(() => {
                this.notificationService.showError('Error al cargar la pieza.');
                this.router.navigate(['/procesos-piezas/grid']);
                return of(null);
            }));
        } else {
            dataRequests['pieza'] = of(null);
        }

        forkJoin(dataRequests).pipe(
            map((results: any) => {
                const typedResults = results as ForkJoinResults;
                this.tiposPieza$ = of(Array.isArray(typedResults.tiposPieza) ? typedResults.tiposPieza : []);
                this.formulas$ = of(Array.isArray(typedResults.formulasResponse.data) ? typedResults.formulasResponse.data : []);
                this.clientes$ = of(Array.isArray(typedResults.clientesResponse.data) ? typedResults.clientesResponse.data : []);

                this.filteredTiposPieza$ = this.setupAutocomplete('idTipoPieza', this.tiposPieza$);
                this.filteredFormulas$ = this.setupAutocomplete('idFormula', this.formulas$);

                this.filteredClientes$ = combineLatest([
                    this.piezaForm.get('idCliente').valueChanges.pipe(
                        startWith(''),
                        map(value => typeof value === 'string' ? value : value?.nombre || '')
                    ),
                    this.clientes$
                ]).pipe(
                    map(([filterValue, clientes]) => {
                        const lowerFilterValue = (filterValue || '').toLowerCase();
                        if (!lowerFilterValue) {
                            return clientes;
                        }
                        return clientes.filter(cliente =>
                            cliente.nombre.toLowerCase().includes(lowerFilterValue) ||
                            (cliente.codigo && cliente.codigo.toLowerCase().includes(lowerFilterValue))
                        );
                    }),
                    catchError(() => of([]))
                );

                return typedResults;
            }),
            catchError(error => {
                this.notificationService.showError('Error al cargar datos iniciales.');
                return throwError(error);
            })
        ).subscribe((results: ForkJoinResults) => {
            if (results.pieza) {
                this.pieza = results.pieza;
                this.patchPiezaForm(this.pieza, results);
            } else if (this.mode === 'create') {
                this.piezaForm.reset({
                    unidadDureza: 'SHORE_A',
                    plano: { sinPlano: false }
                });
            }
        });
    }

    private patchPiezaForm(pieza: PiezaProceso, allLoadedData: ForkJoinResults): void {
        const tipoPiezaObj = allLoadedData.tiposPieza.find(t => t.nombre === pieza.tipo);
        const formulaObj = allLoadedData.formulasResponse.data.find(f => f.nombre === pieza.nombreFormula);

        this.piezaForm.patchValue({
            codigo: pieza.codigo,
            nombre: pieza.denominacion,
            idTipoPieza: tipoPiezaObj,
            idFormula: formulaObj,
            durezaMinima: pieza.durezaMinima,
            durezaMaxima: pieza.durezaMaxima,
            unidadDureza: pieza.unidadDureza,
            pesoCrudo: pieza.pesoCrudo,
            observacionesPesoCrudo: pieza.observacionesPesoCrudo,
            revision: pieza.revision,
            fechaRevision: pieza.fechaRevision,
            observacionesRevision: pieza.observacionesRevision,
            hojaProceso: pieza.hojaProceso,
        });

        this.espesoresDataSource.data = pieza.espesores || [];

        this.abmPiezaService.events.next({ nombrePieza: pieza.denominacion });
        this.updateFormState();
    }

    agregarEspesor(): void {
        if (this.espesorForm.invalid) {
            this.notificationService.showError('Ambos valores de espesor son requeridos.');
            return;
        }

        const min = this.espesorForm.get('min').value;
        const max = this.espesorForm.get('max').value;

        if (min > max) {
            this.notificationService.showError('El espesor mínimo no puede ser mayor al máximo.');
            return;
        }

        const currentData = this.espesoresDataSource.data;
        this.espesoresDataSource.data = [...currentData, { min, max }];
        this.espesorForm.reset();
        this.piezaForm.markAsDirty();
    }

    eliminarEspesor(index: number): void {
        const currentData = this.espesoresDataSource.data;
        currentData.splice(index, 1);
        this.espesoresDataSource.data = [...currentData];
        this.piezaForm.markAsDirty();
    }

    guardarPieza(): void {
        if (this.piezaForm.invalid) {
            this.notificationService.showError('Por favor, complete todos los campos requeridos.');
            this.piezaForm.markAllAsTouched();
            return;
        }

        const sinPlano = this.piezaForm.get('plano.sinPlano').value;
        if (this.mode === 'create' && !sinPlano && !this.selectedFile) {
            this.notificationService.showError('Debe seleccionar un archivo de plano o marcar "No hay plano".');
            return;
        }

        if (this.mode === 'create') {
            this.openInitialRevisionModal();
        } else if (this.mode === 'edit') {
            this.enviarDatosEdicion();
        }
    }

    public crearPieza(revisionInicial: number): void {
        const createAction = (planoArchivo: string | null) => {
            const formValues = this.piezaForm.getRawValue();

            let fechaCotizacionISO = null;
            if (formValues.fechaCotizacionCliente) {
                const dateObj = new Date(formValues.fechaCotizacionCliente);
                fechaCotizacionISO = dateObj.toISOString();
            }

            const dto: PiezaCreateDTO = {
                codigo: formValues.codigo,
                denominacion: formValues.nombre,
                durezaMaxima: formValues.durezaMaxima,
                durezaMinima: formValues.durezaMinima,
                espesores: this.espesoresDataSource.data,
                idCliente: formValues.idCliente?.id,
                idFormula: formValues.idFormula?.id,
                idMolde: formValues.idMolde?.id,
                idTipoPieza: formValues.idTipoPieza?.id,
                nombrePiezaCliente: formValues.nombrePiezaCliente,
                cotizacionCliente: formValues.cotizacionCliente,
                fechaCotizacionCliente: fechaCotizacionISO,
                observacionesCotizacionCliente: formValues.observacionesCotizacionCliente,
                observacionesMolde: formValues.observacionesMolde,
                observacionesPesoCrudo: formValues.observacionesPesoCrudo,
                pesoCrudo: formValues.pesoCrudo,
                planoArchivo: planoArchivo,
                planoClasificacion: formValues.plano.planoClasificacion,
                planoCodigo: formValues.plano.planoCodigo,
                planoObservaciones: formValues.plano.planoObservaciones,
                planoRevision: formValues.plano.planoRevision,
                revisionIncial: revisionInicial,
                unidadDureza: formValues.unidadDureza,
                hojaProceso: formValues.hojaProceso,
            };

            this.abmPiezaService.agregarPieza(dto).subscribe({
                next: (response) => {
                    this.notificationService.showSuccess('Pieza creada correctamente.');
                    const newPiezaId = response?.data?.id;
                    if (newPiezaId) {
                        this.router.navigate([`/procesos-piezas/${newPiezaId}/edit`]);
                    } else {
                        this.router.navigate(['/procesos-piezas/grid']);
                    }
                },
                error: (error) => { this.notificationService.showError('Error al crear la pieza.'); }
            });
        };

        const sinPlano = this.piezaForm.get('plano.sinPlano').value;

        if (!sinPlano && this.selectedFile) {
            const reader = new FileReader();
            reader.onload = () => createAction((reader.result as string).split(',')[1]);
            reader.readAsDataURL(this.selectedFile);
        } else {
            createAction(null);
        }
    }

    private enviarDatosEdicion(): void {
        const formValues = this.piezaForm.getRawValue();
        const dto: Partial<PiezaUpdateDTO> = {
            durezaMinima: formValues.durezaMinima,
            durezaMaxima: formValues.durezaMaxima,
            espesores: this.espesoresDataSource.data,
            pesoCrudo: formValues.pesoCrudo,
            observacionesPesoCrudo: formValues.observacionesPesoCrudo,
            observacionesRevision: formValues.observacionesRevision,
            hojaProceso: formValues.hojaProceso,
        };

        this.abmPiezaService.updatePieza(this.piezaId, dto as PiezaUpdateDTO).subscribe({
            next: () => {
                this.notificationService.showSuccess('Pieza actualizada correctamente.');
                this.piezaForm.markAsPristine();
            },
            error: (error) => { this.notificationService.showError('Error al actualizar la pieza.'); }
        });
    }

    openInitialRevisionModal(): void {
        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Revisión inicial',
                message: 'Introduzca un número de revisión inicial.',
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                type: 'info',
                customComponent: RevisionInicialInputComponent,
                componentData: { initialRevision: this.initialRevision }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === false) { return; }
            let finalRevision: number | null = null;
            if (result && typeof result === 'object' && 'initialRevision' in result) {
                const parsedRevision = Number(result.initialRevision);
                if (!isNaN(parsedRevision)) { finalRevision = parsedRevision; }
            }
            if (finalRevision !== null) {
                this.crearPieza(finalRevision);
            } else {
                this.notificationService.showError('Revisión inicial no proporcionada o inválida. Intente de nuevo.');
            }
        });
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                this.notificationService.showError('Solo se permiten archivos PDF.');
                this.removeSelectedFile();
                return;
            }
            this.selectedFile = file;
            this.piezaForm.get('plano.archivo').setValue(file);
        } else {
            this.selectedFile = null;
            this.notificationService.showError("No se ha seleccionado ningún archivo.");
        }
    }

    removeSelectedFile(): void {
        this.selectedFile = null;
        if (this.piezaForm) { this.piezaForm.get('plano.archivo').setValue(null); }
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
    }

    displayFn(item: any): string { return item?.nombre ?? ''; }
    displayMolde(molde?: { id: number, nombre: string }): string { return molde?.nombre ?? ''; }
    displayCliente(cliente?: { id: number, nombre: string, codigo?: string }): string { return cliente?.nombre ?? ''; }
    displayFormula(formula?: { id: number, nombre: string }): string { return formula?.nombre ?? ''; }

    generarNuevaRevision(): void {
        if (!this.pieza) {
            this.notificationService.showError('No se pueden obtener los datos de la pieza actual.');
            return;
        }

        const message = this.sanitizer.bypassSecurityTrustHtml(
            `Se creará una nueva revisión para la pieza <b>${this.pieza.denominacion}</b> (Rev. ${this.pieza.revision}). Esta nueva revisión no estará vigente. ¿Desea continuar?`
        );

        this.openConfirmationModal(message, 'Generar Nueva Revisión').subscribe(confirmed => {
            if (confirmed) {
                this.abmPiezaService.clonarPieza(this.pieza.id).subscribe({
                    next: (response) => {
                        this.notificationService.showSuccess('Nueva revisión generada exitosamente.');
                        const nuevaPiezaId = response.data?.id;
                        if (nuevaPiezaId) {
                            this.router.navigate(['/procesos-piezas', nuevaPiezaId, 'edit']);
                        } else {
                            this.router.navigate(['/procesos-piezas/grid']);
                        }
                    },
                    error: (err) => {
                        console.error('Error al generar nueva revisión:', err);
                        this.notificationService.showError('Error al generar la nueva revisión.');
                    }
                });
            }
        });
    }

    private openConfirmationModal(message: SafeHtml, title: string): Observable<boolean> {
        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: title,
                message: message,
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                type: 'warning'
            }
        });

        return dialogRef.afterClosed();
    }

    private setupAutocomplete(formControlName: string, data$: Observable<any[]>): Observable<any[]> {
        return combineLatest([
            this.piezaForm.get(formControlName).valueChanges.pipe(
                startWith(''),
                debounceTime(300),
                map(value => typeof value === 'string' ? value : value?.nombre || '')
            ),
            data$
        ]).pipe(
            map(([filterValue, data]) => {
                const lowerFilterValue = (filterValue || '').toLowerCase();
                return data.filter(item => item.nombre.toLowerCase().includes(lowerFilterValue));
            }),
            catchError(() => of([]))
        );
    }
}