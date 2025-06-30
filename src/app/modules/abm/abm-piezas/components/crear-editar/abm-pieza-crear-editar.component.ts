import {
    Component,
    OnInit,
    Input,
    AfterViewInit,
    ViewChild,
    Output,
    EventEmitter,
    ElementRef,
    OnDestroy
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Pieza } from '../../models/pieza.model';
import { Observable, of, combineLatest, forkJoin, throwError } from 'rxjs';
import { map, startWith, debounceTime, catchError, take } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer } from '@angular/platform-browser';
import { FormulasService } from 'app/shared/services/formulas.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { RevisionInicialInputComponent } from './revision-inicial-input.component';

interface ForkJoinResults {
    tiposPieza: { id: number; nombre: string; }[];
    moldes: { id: number; nombre: string; }[];
    formulasResponse: { data: { id: number; nombre: string; }[] };
    clientesResponse: { data: { id: number; nombre: string; }[] };
    pieza: Pieza | null;
}

@Component({
    selector: 'app-abm-pieza-crear-editar',
    templateUrl: './abm-pieza-crear-editar.component.html',
    styleUrls: ['./abm-pieza-crear-editar.component.scss'],
})
export class ABMPiezaCrearEditarComponent extends ABMPiezaBaseComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() piezaId: number | null = null;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    piezaForm: FormGroup;

    pieceNames$: Observable<string[]>;
    tiposPieza$: Observable<{ id: number; nombre: string }[]>;
    moldes$: Observable<{ id: number; nombre: string }[]>;
    formulas$: Observable<{ id: number; nombre: string; }[]>;
    clientes$: Observable<{ id: number; nombre: string; }[]>;

    filteredPieceNames$: Observable<string[]>;
    filteredTiposPieza$: Observable<{ id: number; nombre: string; }[]>;
    filteredFormulas$: Observable<{ id: number; nombre: string; }[]>;
    filteredClientes$: Observable<{ id: number; nombre: string; }[]>;
    filteredMoldes$: Observable<{ id: number; nombre: string; }[]>;

    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
    @Output() guardarPiezaEvent = new EventEmitter<void>();
    @ViewChild('formulaInput') formulaInput: ElementRef<HTMLInputElement>;
    @ViewChild('tipoInput') tipoInput: ElementRef;
    @ViewChild('moldeInput') moldeInput: ElementRef;
    @ViewChild('clienteInput') clienteInput: ElementRef;
    @ViewChild('piezaFormDirective') piezaFormDirective: FormGroupDirective;

    typesFail: boolean = false;

    clasificacionOptions: { value: string; label: string }[] = [
        { value: 'NITROPHYL', label: 'NITROPHYL' },
        { value: 'CLIENTE', label: 'CLIENTE' }
    ];

    tiposDurezaOptions: { value: string; label: string }[] = [
        { value: 'SHORE_A', label: 'Shore A' },
        { value: 'SHORE_D', label: 'Shore D' },
    ];

    selectedFile: File | null = null;
    uploading: boolean = false;
    fileExtension: string = '';
    pieza: Pieza;
    private initialRevision: number = 0;

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog,
        private domSanitizer: DomSanitizer,
        private formulasService: FormulasService,
        private clientesService: ClientesService
    ) {
        super(fb, router, route, abmPiezaService, dialog);

        this.piezaForm = this.fb.group({
            nombre: [{ value: null, disabled: false }, Validators.required],
            codigo: [{ value: null, disabled: false }],
            idTipoPieza: [{ value: null, disabled: false }, Validators.required],
            idMolde: [{ value: null, disabled: false }, Validators.required],
            idFormula: [{ value: null, disabled: false }, Validators.required],
            dureza: [{ value: null, disabled: false }, [Validators.pattern("^[0-9]*$")]],
            tipoDureza: [{ value: null, disabled: false }],
            durezaMinima: [{ value: null, disabled: false }, [Validators.pattern("^[0-9]*$")]],
            durezaMaxima: [{ value: null, disabled: false }, [Validators.pattern("^[0-9]*$")]],
            espesorMinimo: [{ value: null, disabled: false }],
            espesorMaximo: [{ value: null, disabled: false }],
            pesoCrudo: [{ value: null, disabled: false }],
            observacionesPesoCrudo: [{ value: null, disabled: false }],
            idCliente: [{ value: null, disabled: false }],
            nombrePiezaCliente: [{ value: null, disabled: false }],
            observacionesMolde: [{ value: null, disabled: false }],
            revision: [{ value: null, disabled: true }],
            fechaRevision: [{ value: null, disabled: true }],
            observacionesRevision: [{ value: null, disabled: false }],


            plano: this.fb.group({
                archivo: [{ value: null, disabled: false }],
                planoCodigo: [{ value: null, disabled: false }, Validators.required],
                planoRevision: [{ value: null, disabled: false }, [Validators.required, Validators.pattern("^[0-9]*$")]],
                planoClasificacion: [{ value: null, disabled: false }, Validators.required],
                planoObservaciones: [{ value: null, disabled: false }],
            }),
        });
    }

    ngOnInit(): void {
        this.setupConditionalValidators();
        if (this.mode === 'view') {
            this.piezaForm.disable();
        } else if (this.mode === 'edit') {
            this.piezaForm.get('nombre').disable();
            this.piezaForm.get('idTipoPieza').disable();
            this.piezaForm.get('idFormula').disable();
            this.piezaForm.get('idMolde').disable();
        }

        this.loadAllData();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            if (this.mode === 'create' && this.piezaFormDirective) {
                this.piezaFormDirective.resetForm();
                this.removeSelectedFile();
            }
        });
    }

    setupConditionalValidators(): void {
        if (this.mode === 'create') {
            this.piezaForm.get('codigo').setValidators([Validators.required]);
            this.piezaForm.get('tipoDureza').setValidators([Validators.required]);
            this.piezaForm.get('durezaMinima').setValidators([Validators.required, Validators.pattern("^[0-9]*$")]);
            this.piezaForm.get('durezaMaxima').setValidators([Validators.required, Validators.pattern("^[0-9]*$")]);
            this.piezaForm.get('dureza').clearValidators();
        } else {
            this.piezaForm.get('codigo').clearValidators();
            this.piezaForm.get('dureza').setValidators([Validators.required, Validators.pattern("^[0-9]*$")]);
            this.piezaForm.get('tipoDureza').clearValidators();
            this.piezaForm.get('durezaMinima').clearValidators();
            this.piezaForm.get('durezaMaxima').clearValidators();
        }
        this.piezaForm.get('codigo').updateValueAndValidity();
        this.piezaForm.get('dureza').updateValueAndValidity();
        this.piezaForm.get('tipoDureza').updateValueAndValidity();
        this.piezaForm.get('durezaMinima').updateValueAndValidity();
        this.piezaForm.get('durezaMaxima').updateValueAndValidity();
    }

    loadAllData(): void {
        const dataRequests: { [key: string]: Observable<any> } = {
            pieceNames: this.abmPiezaService.getPiezaNombre().pipe(catchError(err => { console.error("Error cargando nombres de pieza:", err); return of([]); })),
            tiposPieza: this.abmPiezaService.getPiezaTipo().pipe(catchError(err => { console.error("Error cargando tipos de pieza:", err); return of([]); })),
            moldes: this.abmPiezaService.getMoldes().pipe(catchError(err => { console.error("Error cargando moldes:", err); return of([]); })),
            formulasResponse: this.formulasService.get().pipe(catchError(err => { console.error("Error cargando fórmulas:", err); return of({ data: [] }); })),
            clientesResponse: this.clientesService.getClientes().pipe(catchError(err => { console.error("Error cargando clientes:", err); return of({ data: [] }); })),
        };

        if (this.piezaId) {
            dataRequests['pieza'] = this.abmPiezaService.getPieza(this.piezaId).pipe(catchError(err => { console.error("Error cargando pieza:", err); return of(null); }));
        } else {
            dataRequests['pieza'] = of(null);
        }

        forkJoin(dataRequests).pipe(
            map((results: any) => {
                const typedResults = results as ForkJoinResults;
                const formulasData = Array.isArray(typedResults.formulasResponse.data) ? typedResults.formulasResponse.data.map(f => ({ id: f.id, nombre: f.nombre })) : [];
                const clientesData = Array.isArray(typedResults.clientesResponse.data) ? typedResults.clientesResponse.data.map(c => ({ id: c.id, nombre: c.nombre })) : [];
                const tiposPiezaData = Array.isArray(typedResults.tiposPieza) ? typedResults.tiposPieza.map(t => ({ id: t.id, nombre: t.nombre })) : [];
                const moldesData = Array.isArray(typedResults.moldes) ? typedResults.moldes.map(m => ({ id: m.id, nombre: m.nombre })) : [];
                const pieceNamesData = Array.isArray(results.pieceNames) ? results.pieceNames : [];

                this.pieceNames$ = of(pieceNamesData);
                this.tiposPieza$ = of(tiposPiezaData);
                this.moldes$ = of(moldesData);
                this.formulas$ = of(formulasData);
                this.clientes$ = of(clientesData);

                this.setupFilteredPieceNames();
                this.filteredTiposPieza$ = this.setupAutocomplete('idTipoPieza', this.tiposPieza$);
                this.filteredFormulas$ = this.setupAutocomplete('idFormula', this.formulas$);
                this.filteredClientes$ = this.setupAutocomplete('idCliente', this.clientes$);
                this.filteredMoldes$ = this.setupAutocomplete('idMolde', this.moldes$);

                return typedResults;
            }),
            catchError(error => {
                console.error('Error al cargar datos iniciales:', error);
                this.openSnackBar(false, 'Error al cargar datos iniciales.', 'red');
                return throwError(error);
            })
        ).subscribe((results: ForkJoinResults) => {
            if (results.pieza) {
                this.pieza = results.pieza;
                this.patchPiezaForm(this.pieza, results);
            }
        });
    }

    private patchPiezaForm(pieza: Pieza, allLoadedData: ForkJoinResults): void {
        const patchValues: any = {};

        if (pieza.denominacion) {
            patchValues.nombre = pieza.denominacion;
        }

        if (pieza.tipo && allLoadedData.tiposPieza) {
            patchValues.idTipoPieza = allLoadedData.tiposPieza.find(t => t.nombre === pieza.tipo);
        }

        if (pieza.idMolde && allLoadedData.moldes) {
            patchValues.idMolde = allLoadedData.moldes.find(m => m.id === pieza.idMolde);
        } else if (pieza.molde && allLoadedData.moldes) {
            patchValues.idMolde = allLoadedData.moldes.find(m => m.nombre === pieza.molde);
        }
        patchValues.observacionesMolde = pieza.observacionesMolde;

        if (pieza.formula && allLoadedData.formulasResponse && allLoadedData.formulasResponse.data) {
            patchValues.idFormula = allLoadedData.formulasResponse.data.find(f => f.nombre === pieza.formula);
        }

        if (typeof pieza.clienteId === 'number' && allLoadedData.clientesResponse && allLoadedData.clientesResponse.data) {
            patchValues.idCliente = allLoadedData.clientesResponse.data.find(c => c.id === pieza.clienteId);
        } else if (pieza.nombreCliente && allLoadedData.clientesResponse && allLoadedData.clientesResponse.data) {
            patchValues.idCliente = allLoadedData.clientesResponse.data.find(c => c.nombre === pieza.nombreCliente);
        }

        patchValues.codigo = pieza.codigo;
        patchValues.dureza = pieza.dureza;
        patchValues.tipoDureza = pieza.unidadDureza;
        patchValues.durezaMinima = pieza.durezaMinima;
        patchValues.durezaMaxima = pieza.durezaMaxima;
        patchValues.espesorMinimo = pieza.espesorPlanchaMin;
        patchValues.espesorMaximo = pieza.espesorPlanchaMax;
        patchValues.pesoCrudo = pieza.pesoCrudo;
        patchValues.observacionesPesoCrudo = pieza.observacionesPesoCrudo;
        patchValues.nombrePiezaCliente = pieza.nombrePiezaPersonalizado;
        patchValues.revision = pieza.revision;
        patchValues.fechaRevision = pieza.fechaRevision;
        patchValues.observacionesRevision = pieza.observacionesRevision;

        this.piezaForm.patchValue(patchValues);
    }

    setupFilteredPieceNames(): void {
        this.filteredPieceNames$ = combineLatest([
            this.piezaForm.get('nombre').valueChanges.pipe(startWith('')),
            this.pieceNames$
        ]).pipe(
            map(([value, pieceNames]) => {
                const filterValue = (value || '').toLowerCase();
                if (!filterValue) {
                    return pieceNames;
                }
                return pieceNames.filter(name => name.toLowerCase().includes(filterValue));
            }),
            catchError(error => { console.error("Error filtrando nombres de pieza:", error); return of([]); })
        );
    }

    guardarPieza(): void {
        if (this.mode === 'create') {
            if (this.piezaForm.invalid) {
                this.openSnackBar(false, 'Por favor, complete todos los campos requeridos y revise el plano.', 'red');
                this.piezaForm.markAllAsTouched();
                this.restoreSaveButtonState();
                return;
            }
            this.openInitialRevisionModal();
        } else if (this.mode === 'edit') {
            this.enviarDatosEdicion();
        }
    }


    public crearPieza(revisionInicial: number): void {
        if (this.selectedFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Plano = (reader.result as string).split(',')[1];
                this.enviarDatosCreacion(revisionInicial, base64Plano);
            };
            reader.readAsDataURL(this.selectedFile);
        } else {
            this.enviarDatosCreacion(revisionInicial, null);
        }
    }

    private enviarDatosCreacion(revisionInicial: number, planoArchivo: string | null): void {
        const formValues = this.piezaForm.getRawValue();

        const dto = {
            codigo: formValues.codigo,
            denominacion: formValues.nombre?.nombre || formValues.nombre,
            durezaMaxima: formValues.durezaMaxima,
            durezaMinima: formValues.durezaMinima,
            espesorMaximo: formValues.espesorMaximo,
            espesorMinimo: formValues.espesorMinimo,
            idCliente: formValues.idCliente?.id,
            idFormula: formValues.idFormula?.id,
            idMolde: formValues.idMolde?.id,
            idTipoPieza: formValues.idTipoPieza?.id,
            nombrePiezaCliente: formValues.nombrePiezaCliente,
            observacionesMolde: formValues.observacionesMolde,
            observacionesPesoCrudo: formValues.observacionesPesoCrudo,
            pesoCrudo: formValues.pesoCrudo,
            planoArchivo: planoArchivo,
            planoClasificacion: formValues.plano.planoClasificacion,
            planoCodigo: formValues.plano.planoCodigo,
            planoObservaciones: formValues.plano.planoObservaciones,
            planoRevision: formValues.plano.planoRevision,
            revisionIncial: revisionInicial,
            unidadDureza: formValues.tipoDureza,
        };

        this.abmPiezaService.agregarPieza(dto).subscribe({
            next: (response) => {
                this.openSnackBar(true, 'Pieza creada correctamente.', 'green');
                const newPiezaId = response?.id;
                if (newPiezaId) {
                    this.router.navigate([`/procesos-piezas/${newPiezaId}/edit`]);
                } else {
                    this.router.navigate(['/procesos-piezas/grid']);
                }
            },
            error: (error) => {
                this.openSnackBar(false, 'Error al crear la pieza.', 'red');
                console.error(error);
                this.restoreSaveButtonState();
            }
        });
    }

    private enviarDatosEdicion(): void {
        if (this.piezaForm.invalid) {
            this.openSnackBar(false, 'Por favor, complete todos los campos requeridos para la edición.', 'red');
            this.piezaForm.markAllAsTouched();
            this.restoreSaveButtonState();
            return;
        }

        const formValues = this.piezaForm.getRawValue();

        const dto: Pieza = {
            id: this.piezaId,
            vigente: this.pieza.vigente,
            codigo: formValues.codigo,
            denominacion: formValues.nombre?.nombre || formValues.nombre,
            tipo: this.pieza.tipo,
            material: this.pieza.material,
            formula: this.pieza.formula,
            molde: this.pieza.molde,
            idMolde: this.pieza.idMolde,
            revision: formValues.revision,
            fechaRevision: formValues.fechaRevision,
            puedeMarcarVigente: this.pieza.puedeMarcarVigente,
            puedeGenerarRevision: this.pieza.puedeGenerarRevision,
            espesorPlanchaMin: formValues.espesorMinimo,
            espesorPlanchaMax: formValues.espesorMaximo,
            pesoCrudo: formValues.pesoCrudo,
            observacionesPesoCrudo: formValues.observacionesPesoCrudo,
            dureza: formValues.dureza,
            clienteId: formValues.idCliente?.id || this.pieza.clienteId,
            nombreCliente: formValues.idCliente?.nombre || this.pieza.nombreCliente,
            nombrePiezaPersonalizado: formValues.nombrePiezaCliente,
            unidadDureza: formValues.tipoDureza,
            observacionesMolde: formValues.observacionesMolde,
            durezaMinima: formValues.durezaMinima,
            durezaMaxima: formValues.durezaMaxima,
            observacionesRevision: formValues.observacionesRevision
        };

        this.abmPiezaService.editarPieza(dto).subscribe({
            next: () => {
                this.openSnackBar(true, 'Pieza actualizada correctamente.', 'green');
                this.abmPiezaService.events.next({
                    type: 'piezaGuardada',
                    nombrePieza: dto.denominacion,
                    mostrarBotonEdicion: true,
                    botonEdicionTexto: 'Guardar Pieza'
                });
            },
            error: (error) => {
                this.openSnackBar(false, 'Error al actualizar la pieza.', 'red');
                console.error(error);
                this.abmPiezaService.events.next({
                    mostrarBotonEdicion: true,
                    botonEdicionTexto: 'Guardar Pieza',
                    nombrePieza: this.piezaForm.get('nombre')?.value?.nombre || this.piezaForm.get('nombre')?.value
                });
            }
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
            if (result === false) {
                this.restoreSaveButtonState();
                return;
            }

            let finalRevision: number | null = null;
            if (result && typeof result === 'object' && 'initialRevision' in result) {
                const parsedRevision = Number(result.initialRevision);
                if (!isNaN(parsedRevision)) {
                    finalRevision = parsedRevision;
                }
            }

            if (finalRevision !== null) {
                this.crearPieza(finalRevision);
            }
            else {
                this.openSnackBar(false, 'Revisión inicial no proporcionada o inválida. Intente de nuevo.', 'red');
                this.restoreSaveButtonState();
            }
        });
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                this.openSnackBar(false, 'Solo se permiten archivos PDF.', 'red');
                this.removeSelectedFile();
                return;
            }
            this.selectedFile = file;
            this.fileExtension = file.name.split('.').pop() || '';
            this.piezaForm.get('plano.archivo').setValue(file);
        } else {
            this.selectedFile = null;
            this.openSnackBar(false, "No se ha seleccionado ningún archivo.", 'red');
        }
    }

    removeSelectedFile(): void {
        this.selectedFile = null;
        if (this.piezaForm) {
            this.piezaForm.get('plano.archivo').setValue(null);
        }
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
        this.fileExtension = '';
    }

    displayFn(item: any): string {
        return item?.nombre ?? '';
    }

    displayFormula(formula?: { id: number, nombre: string }): string {
        return formula?.nombre ?? '';
    }

    displayMolde(molde?: { id: number, nombre: string }): string {
        return molde?.nombre ?? '';
    }

    displayCliente(cliente?: { id: number, nombre: string }): string {
        return cliente?.nombre ?? '';
    }

    private openSnackBar(isSuccess: boolean, message: string, cssClass?: string, duration?: number): void {
        this.snackBar.open(message, 'X', {
            duration: duration || 5000,
            panelClass: [isSuccess ? 'green-snackbar' : 'red-snackbar', cssClass || ''],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private setupAutocomplete(formControlName: string, data$: Observable<any[]>): Observable<any[]> {
        return combineLatest([
            this.piezaForm.get(formControlName).valueChanges.pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value?.nombre || '')
            ),
            data$
        ]).pipe(
            map(([filterValue, data]) => {
                const lowerFilterValue = filterValue.toLowerCase();
                return data.filter(item => item.nombre.toLowerCase().includes(lowerFilterValue));
            }),
            catchError(error => {
                console.error(`Error ${formControlName}:`, error);
                return of([]);
            })
        );
    }

    private restoreSaveButtonState(): void {
        this.abmPiezaService.events.next({
            mostrarBotonEdicion: true,
            botonEdicionTexto: 'Guardar Pieza',
            nombrePieza: this.piezaForm.get('nombre')?.value?.nombre || this.piezaForm.get('nombre')?.value
        });
    }
}