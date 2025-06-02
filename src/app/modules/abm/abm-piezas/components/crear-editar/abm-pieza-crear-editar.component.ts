import {
    Component,
    OnInit,
    Input,
    AfterViewInit,
    ViewChild,
    Output,
    EventEmitter,
    ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Pieza } from '../../models/pieza.model';
import { Observable, of, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, debounceTime, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer } from '@angular/platform-browser';
import { take } from 'rxjs/operators';

import { FormulasService } from 'app/shared/services/formulas.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { IFormula } from 'app/shared/models/formula.interface';
import { Cliente } from 'app/shared/models/cliente.model';

import { RevisionInicialInputComponent } from './revision-inicial-input.component';

@Component({
    selector: 'app-abm-pieza-crear-editar',
    templateUrl: './abm-pieza-crear-editar.component.html',
    styleUrls: ['./abm-pieza-crear-editar.component.scss'],
})
export class ABMPiezaCrearEditarComponent extends ABMPiezaBaseComponent implements OnInit, AfterViewInit {
    @Input() piezaId: number | null = null;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    piezaForm: FormGroup;
    planoForm: FormGroup;

    pieceNames$: Observable<Pieza[]>;
    filteredPieceNames$: Observable<Pieza[]>;
    formulas$: Observable<{ id: number; nombre: string }[]>;
    tiposDimension$: Observable<string[]>;
    tiposPieza$: Observable<string[]>;
    moldes$: Observable<{ id: number; nombre: string }[]>;
    clientes$: Observable<{ id: number; nombre: string }[]>;

    filteredFormulas$: Observable<{ id: number; nombre: string }[]>;
    filteredClientes$: Observable<{ id: number; nombre: string }[]>;

    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
    @Output() guardarPiezaEvent = new EventEmitter<void>();
    @ViewChild('formulaInput') formulaInput: ElementRef<HTMLInputElement>;
    @ViewChild('tipoInput') tipoInput: ElementRef;
    @ViewChild('moldeInput') moldeInput: ElementRef;
    @ViewChild('clienteInput') clienteInput: ElementRef;

    typesFail: boolean = false;
    types$: Observable<any>;
    private _types = new BehaviorSubject<any>(null);
    public $types: Observable<any> = this._types.asObservable();

    clasificacionOptions: { value: string; label: string }[] = [
        { value: 'NITROPHYL', label: 'NITROPHYL' },
        { value: 'CLIENTE', label: 'CLIENTE' }
    ];

    selectedFile: File | null = null;
    uploading: boolean = false;
    buttonText: string = 'Subir Plano';
    fileExtension: string = '';

    revision: string;
    fechaRevision: Date;
    observacionesRevision: string;
    pieza: Pieza;
    private initialRevision: number = 0;

    filteredMoldes$: Observable<{ id: number; nombre: string }[]>;

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
            nombre: [null, Validators.required],
            tipo: [null, Validators.required],
            moldeId: [null, Validators.required],
            formula: ['', Validators.required],
            dureza: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
            espesorPlanchaMin: [null],
            espesorPlanchaMax: [null],
            pesoCrudo: [null],
            observacionesPesoCrudo: [''],
            clienteId: [null],
            nombrePiezaPersonalizado: [null],
            revision: [{ value: null, disabled: true }],
            fechaRevision: [{ value: null, disabled: true }],
            observacionesRevision: [''],
            codigo: [''],
            clasificacion: [''],
            descripcion: [''],
        });

        this.planoForm = this.fb.group({
            archivo: [null],
            codigo: ['', Validators.required],
            revisionPlano: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
            clasificacion: ['', Validators.required],
            descripcion: [''],
        });

        this.pieceNames$ = this.abmPiezaService.getPiezaNombre();

        this.filteredPieceNames$ = combineLatest([this.piezaForm.get('nombre').valueChanges, this.pieceNames$]).pipe(
            startWith([null, []]),
            debounceTime(200),
            map(([value, pieceNames]) => {
                let filterValue = '';

                if (typeof value === 'string') {
                    filterValue = value.toLowerCase();
                } else if (value && typeof value === 'object' && value.nombre) {
                    filterValue = value.nombre.toLowerCase();
                }

                const validPieceNames = Array.isArray(pieceNames) ? pieceNames : [];

                return validPieceNames.filter(pieceName => pieceName.nombre.toLowerCase().includes(filterValue));
            })
        );

        this.tiposDimension$ = this.abmPiezaService.getTiposDimension();
        this.tiposPieza$ = this.abmPiezaService.getTipoPieza();
        this.moldes$ = this.abmPiezaService.getMoldes();

        this.formulas$ = this.formulasService.get().pipe(
            map(response => {
                const data = response?.data;
                if (Array.isArray(data)) {
                    return data.map(item => ({
                        id: item.id,
                        nombre: item.nombre
                    }));
                } else if (data) {
                    const formula = data as IFormula;
                    return [{
                        id: formula.id,
                        nombre: formula.nombre
                    }];
                } else {
                    return [];
                }
            })
        );

        this.clientes$ = this.clientesService.getClientes().pipe(
            map(response => {
                const data = response?.data;
                if (Array.isArray(data)) {
                    return data.map(item => ({
                        id: item.id,
                        nombre: item.nombre
                    }));
                } else if (data) {
                    const cliente = data as Cliente;
                    return [{
                        id: cliente.id,
                        nombre: cliente.nombre
                    }];
                } else {
                    return [];
                }
            })
        );

        this.filteredFormulas$ = this.setupAutocomplete('formula', this.formulas$);
        this.filteredClientes$ = this.setupAutocomplete('clienteId', this.clientes$);
        this.filteredMoldes$ = this.setupAutocomplete('moldeId', this.moldes$);
    }

    ngOnInit(): void {
        this.loadAllData();
        if (this.mode === 'edit' && this.piezaId) {
            this.cargarPieza(this.piezaId);
        } else if (this.mode === 'view' && this.piezaId) {
            this.cargarPieza(this.piezaId);
            this.piezaForm.disable();
        }
    }

    ngAfterViewInit(): void {
        if (this.mode === 'edit' && this.piezaForm.get('nombre').value) {
            Promise.resolve(null).then(() => {
                this.autocompleteTrigger.openPanel();
            });
        }
    }

    cargarPieza(id: number): void {
        combineLatest([
            this.abmPiezaService.getPieza(id),
            this.pieceNames$,
            this.formulas$
        ]).pipe(take(1)).subscribe(([pieza, pieceNames, formulas]) => {
            if (pieza) {
                this.pieza = pieza;

                const pieceName = pieceNames.find(pn => pn.nombre === pieza.nombre);
                const initialPieceName = pieceName || { id: null, nombre: pieza.nombre };

                const formulaEncontrada = formulas.find(f => f.nombre === pieza.formula);

                this.piezaForm.patchValue({
                    nombre: initialPieceName,
                    tipo: pieza.tipo,
                    formula: formulaEncontrada ? formulaEncontrada : pieza.formula,
                    dureza: pieza.dureza,
                    moldeId: pieza.moldeId,
                    espesorPlanchaMax: pieza.espesorPlanchaMax,
                    espesorPlanchaMin: pieza.espesorPlanchaMin,
                    pesoCrudo: pieza.pesoCrudo,
                    observacionesPesoCrudo: pieza.observacionesPesoCrudo,
                    clienteId: pieza.clienteId,
                    nombrePiezaPersonalizado: pieza.nombrePiezaPersonalizado,
                    revision: pieza.revision,
                    fechaRevision: pieza.fechaRevision,
                    observacionesRevision: this.observacionesRevision
                });

                this.piezaForm.get('nombre').updateValueAndValidity();

                if (this.mode === 'edit') {
                    this.piezaForm.get('nombre').disable();
                    this.piezaForm.get('tipo').disable();
                    this.piezaForm.get('formula').disable();
                }
            } else {
                this.openSnackBar(false, 'Pieza no encontrada.');
                this.router.navigate(['/procesos-piezas/grid']);
            }
        });
    }

    guardarPieza(): void {
        if (this.piezaForm.valid) {
            const piezaData = this.piezaForm.getRawValue();
            const nombreControl = this.piezaForm.get('nombre');
            const nombreValue = nombreControl.value;
            const nombre = typeof nombreValue === 'object' && nombreValue !== null ? nombreValue.nombre : nombreValue;

            const pieza: Pieza = {
                ...piezaData,
                nombre: nombre,
                id: this.piezaId
            };

            if (this.mode === 'create') {
                this.openInitialRevisionModal()
            } else if (this.mode === 'edit' && this.piezaId !== null) {
                pieza.id = this.piezaId;
                pieza.observacionesPesoCrudo = this.piezaForm.get('observacionesPesoCrudo').value;
                pieza.revision = this.piezaForm.get('revision').value;
                pieza.fechaRevision = this.piezaForm.get('fechaRevision').value;
                pieza.observacionesPesoCrudo = this.piezaForm.get('observacionesPesoCrudo').value;

                this.abmPiezaService.editarPieza(pieza).subscribe({
                    next: () => {
                        this.openSnackBar(true, 'Pieza editada correctamente.', 'green');
                        this.abmPiezaService.events.next('piezaGuardada');
                    },
                    error: (error) => {
                        this.openSnackBar(false, 'Error al editar la pieza.');
                    }
                });
            }
        } else {
            this.openSnackBar(false, 'Por favor, complete todos los campos.');
        }
    }

    marcarVigente(pieza: Pieza): void {
        this.abmPiezaService.marcarVigente(pieza.id).subscribe({
            next: () => {
                this.openSnackBar(true, 'Pieza marcada como vigente.', 'green');
                this.pieza.vigente = true;
            },
            error: (error) => {
                this.openSnackBar(false, 'Error al marcar la pieza como vigente.');
            }
        });
    }

    displayPieceName(piece?: Pieza): string | undefined {
        return piece ? piece.nombre : undefined;
    }

    displayFn(item: any): string {
        return item && item.nombre ? item.nombre : '';
    }

    displayMolde(molde?: { id: number; nombre: string }): string | undefined {
        return molde ? molde.nombre : undefined;
    }

    displayCliente(cliente?: { id: number; nombre: string }): string | undefined {
        return cliente ? cliente.nombre : undefined;
    }

    loadAllData(): void {
        const error: string = 'ABMPiezaCrearEditarComponent => loadData: ';

        combineLatest([
            this.getTiposDimensiones(),
            this.clientes$,
            this.abmPiezaService.getMoldes(),
            this.getTiposPieza()
        ]).subscribe({
            next: ([tiposDimension, clientes, moldes, tipospieza]: [any, any, any, any]) => {
                this.tiposDimension$ = of(tiposDimension);
                this.moldes$ = of(moldes);
                this.tiposPieza$ = of(tipospieza)
            },
            error: (err: any) => console.error(error, err),
            complete: () => { },
        });
    }

    getTiposDimensiones(): Observable<any> {
        const error: string = 'ABMPiezaCrearEditarComponent => getTiposDimensiones: ';
        return this.abmPiezaService.getTiposDimension().pipe(
            catchError((err: any) => {
                console.error(error, 'this.tipoService.get() ', err);
                this.typesFail = true;
                return of([]);
            }),
            map((response: any) => {
                if (response) {
                    this._types.next(response);
                    return response;
                }
            })
        );
    }

     getTiposPieza(): Observable<any> {
        const error: string = 'ABMPiezaCrearEditarComponent => getTiposPieza: ';
        return this.abmPiezaService.getTipoPieza().pipe(
            catchError((err: any) => {
                console.error(error, 'this.tipoService.get() ', err);
                this.typesFail = true;
                return of([]);
            }),
            map((response: any) => {
                if (response) {
                    this._types.next(response);
                    return response;
                }
            })
        );
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file) {
            this.selectedFile = file;
            const fileName = file.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            this.fileExtension = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex);
        } else {
            this.selectedFile = null;
            this.openSnackBar(false, "No se ha seleccionado ningún archivo.");
            this.fileExtension = '';
        }
    }

    removeSelectedFile(): void {
        this.selectedFile = null;
        this.planoForm.patchValue({
            archivo: null,
        });

        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
        this.planoForm.updateValueAndValidity();
    }

    clearFormulaInput(): void {
        this.piezaForm.get('formula')?.setValue(null);
        this.formulaInput.nativeElement.value = '';
    }

    clearTipoInput(): void {
        this.piezaForm.get('tipo')?.setValue(null);
        this.tipoInput.nativeElement.value = '';
    }

    clearMoldeInput(): void {
        this.piezaForm.get('moldeId')?.setValue(null);
        this.moldeInput.nativeElement.value = '';
    }

    clearClienteInput(): void {
        this.piezaForm.get('clienteId')?.setValue(null);
        this.clienteInput.nativeElement.value = '';
    }

    subirPlano(): void {
        if (!this.selectedFile) {
            this.openSnackBar(false, "Por favor, seleccione un archivo.");
            return;
        }

        if (this.planoForm.invalid) {
            this.openSnackBar(false, "Por favor, complete todos los campos del formulario de plano.");
            return;
        }

        const fileName = this.selectedFile.name;
        const codigo = this.planoForm.get('codigo').value;
        const revision = this.planoForm.get('revisionPlano').value;
        const clasificacion = this.planoForm.get('clasificacion').value;
        const descripcion = this.planoForm.get('descripcion').value;

        const fileReader = new FileReader();
        fileReader.onload = () => {
            const fileData = fileReader.result as string;
            const base64Data = fileData.split(',')[1];

            this.abmPiezaService.uploadPlano(
                this.piezaId,
                base64Data,
                fileName,
                descripcion,
                clasificacion,
                codigo,
                revision,
            ).subscribe({
                next: (response) => {
                    this.openSnackBar(true, 'Archivo subido exitosamente.', 'green-snackbar');
                },
                error: (error) => {
                    this.openSnackBar(false, 'Error al subir el archivo.', 'red-snackbar');
                }
            });
        };
        fileReader.readAsDataURL(this.selectedFile);
    }

    resetForm(): void {
        this.uploading = false;
        this.buttonText = 'Subir';
        this.selectedFile = null;
        this.planoForm.reset();

        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }

        this.planoForm.patchValue({ archivo: null });
    }

    openInitialRevisionModal(): void {
        const message = this.domSanitizer.bypassSecurityTrustHtml(
            '¿Desea iniciar la revisión en 0 o introducir un número de revisión inicial?'
        );

        const dialogRef = this.dialog.open(GenericModalComponent, {
            width: '400px',
            data: {
                title: 'Revisión inicial',
                message: message,
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                type: 'warning',
                customComponent: RevisionInicialInputComponent,
                // componentData: { initialRevision: this.initialRevision },

                onConfirm: () => {
                    this.crearPieza()
                },
                onCancel: () => {
                    this.initialRevision = 0;
                    this.crearPieza()
                }
            }
        });
    }

    crearPieza(): void {
        this.subirPlano();

        const piezaData = this.piezaForm.getRawValue();
        const nombreControl = this.piezaForm.get('nombre');
        const nombreValue = nombreControl.value;
        const nombre = typeof nombreValue === 'object' && nombreValue !== null ? nombreValue.nombre : nombreValue;
        const moldeValue = this.piezaForm.get('moldeId').value;
        const moldeId = typeof moldeValue === 'object' && moldeValue !== null ? moldeValue.id : moldeValue;
        const clienteValue = this.piezaForm.get('clienteId').value;
        const clienteId = typeof clienteValue === 'object' && clienteValue !== null ? clienteValue.id : clienteValue;
        const pieza: Pieza = {
            ...piezaData,
            nombre: nombre,
            moldeId: moldeId,
            clienteId: clienteId,
            revision: this.initialRevision.toString()
        };

        this.abmPiezaService.agregarPieza(pieza).subscribe({
            next: () => {
                this.openSnackBar(true, 'Pieza creada correctamente.', 'green');
                this.abmPiezaService.events.next('piezaGuardada');
            },
            error: (error) => {
                this.openSnackBar(false, 'Error al crear la pieza.');
            }
        });
    }

    displayFormula(formula?: { id: number; nombre: string }): string | undefined {
        return formula ? formula.nombre : undefined;
    }

    private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
        const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
        const defaultCss: string = css ? css : 'red';
        const snackBarMessage = message ? message : defaultMessage;
        const snackBarCss = css ? css : defaultCss;
        const snackBarDuration = duration ? duration : 5000;

        this.snackBar.open(snackBarMessage, 'X', {
            duration: snackBarDuration,
            panelClass: `${snackBarCss}-snackbar`,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private setupAutocomplete(formControlName: string, data$: Observable<any[]>): Observable<any[]> {
        return combineLatest([
            this.piezaForm.get(formControlName).valueChanges.pipe(startWith('')),
            data$
        ]).pipe(
            map(([value, data]) => {
                const filterValue = typeof value === 'string' ? value.toLowerCase() : (value?.nombre || '').toLowerCase();
                return data.filter(item => item.nombre.toLowerCase().includes(filterValue));
            })
        );
    }
}