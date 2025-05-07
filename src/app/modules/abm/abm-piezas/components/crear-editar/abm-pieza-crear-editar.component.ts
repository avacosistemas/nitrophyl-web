import { Component, OnInit, Input, AfterViewInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Pieza } from '../../models/pieza.model';
import { Observable, of, combineLatest } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

interface PieceName {
    id: number;
    nombre: string;
}

@Component({
    selector: 'app-abm-pieza-crear-editar',
    templateUrl: './abm-pieza-crear-editar.component.html',
    styleUrls: ['./abm-pieza-crear-editar.component.scss'],
})
export class ABMPiezaCrearEditarComponent extends ABMPiezaBaseComponent implements OnInit, AfterViewInit {
    @Input() piezaId: number | null = null;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    piezaForm: FormGroup;

    pieceNames$: Observable<PieceName[]>;
    filteredPieceNames$: Observable<PieceName[]>;
    formulas$: Observable<{ id: number; nombre: string }[]>;
    moldes$: Observable<{ id: number; nombre: string }[]>;

    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
    @Output() guardarPiezaEvent = new EventEmitter<void>();


    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) {
        super(fb, router, route, abmPiezaService, dialog);
        this.piezaForm = this.fb.group({
            nombre: [null, Validators.required],
            formulaCodigo: ['', Validators.required],
            moldeId: [null, Validators.required],
            espesorPlanchaMin: [null],
            espesorPlanchaMax: [null],
            pesoCrudo: [null],
            observacionesPesoCrudo: [''],
        });

        this.pieceNames$ = this.abmPiezaService.getPieceNames();

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

        this.formulas$ = this.abmPiezaService.getFormulas();
        this.moldes$ = this.abmPiezaService.getMoldes();
    }

    ngOnInit(): void {
        if (this.mode === 'edit' && this.piezaId) {
            this.cargarPieza(this.piezaId);
        }else if (this.mode === 'view' && this.piezaId) {
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
        this.abmPiezaService.getPieza(id).subscribe(pieza => {
            if (pieza) {
                this.pieceNames$.subscribe(pieceNames => {
                    const pieceName = pieceNames.find(pn => pn.nombre === pieza.nombre);

                    const initialPieceName = pieceName || { id: null, nombre: pieza.nombre };

                    this.piezaForm.patchValue({
                        nombre: initialPieceName, 
                        formulaCodigo: pieza.formulaCodigo,
                        moldeId: pieza.moldeId,
                        espesorPlanchaMin: pieza.espesorPlanchaMax,
                        espesorPlanchaMax: pieza.espesorPlanchaMax,
                        pesoCrudo: pieza.pesoCrudo,
                        observacionesPesoCrudo: pieza.observacionesPesoCrudo,
                    });

                    this.piezaForm.get('nombre').updateValueAndValidity();
                });
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
                this.abmPiezaService.agregarPieza(pieza).subscribe({
                    next: (savedPieza) => {
                        this.openSnackBar(true, 'Pieza creada correctamente.', 'green');
                        this.abmPiezaService.events.next('piezaGuardada');
                        this.router.navigate(['/procesos-piezas', savedPieza.id, 'edit']);
                    },
                    error: (error) => {
                        this.openSnackBar(false, 'Error al crear la pieza.');
                    }
                });
            } else if (this.mode === 'edit' && this.piezaId !== null) {
                pieza.id = this.piezaId;
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

    private _filterPieceNames(value: string): Observable<PieceName[]> {
        const filterValue = value.toLowerCase();
        if (!this.pieceNames$) {
            return of([]);
        }
        return this.pieceNames$.pipe(
            map(pieceNames => {
                if (!pieceNames) {
                    return [];
                }
                return pieceNames.filter(pieceName => pieceName.nombre.toLowerCase().includes(filterValue));
            })
        );
    }

    displayPieceName(piece?: PieceName): string | undefined {
        return piece ? piece.nombre : undefined;
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
}