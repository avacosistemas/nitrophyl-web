import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Prensa, Bombeo, Moldeo } from '../../models/pieza.model';
import { Observable, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { startWith, switchMap, map } from 'rxjs/operators';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
    selector: 'app-abm-pieza-moldeo',
    templateUrl: './abm-pieza-moldeo.component.html',
    styleUrls: ['./abm-pieza-moldeo.component.scss']
})
export class ABMPiezaMoldeoComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
    @Input() mode: 'create' | 'edit' | 'view' = 'create';
    moldeo$: Observable<Moldeo>;
    prensas$: Observable<Prensa[]>;
    tiposBombeo$: Observable<string[]>;

    moldeoForm = this.fb.group({
        precalentamientoHabilitado: [{ value: false, disabled: this.mode === 'view' }],
        precalentamientoTiempo: [{ value: null, disabled: true }],
        precalentamientoUnidad: [{ value: 'minutos', disabled: true }],
        vulcanizacionTiempo: [{ value: null, disabled: this.mode === 'view' }, Validators.required],
        vulcanizacionTemperaturaMinima: [{ value: null, disabled: this.mode === 'view' }, Validators.required],
        vulcanizacionTemperaturaMaxima: [{ value: null, disabled: this.mode === 'view' }, Validators.required],
        bombas: this.fb.array([]),
    });


    prensaCtrl = new FormControl({ value: '', disabled: this.mode === 'view' });
    prensasAgregadas: Prensa[] = [];
    filteredPrensas$: Observable<Prensa[]>;


    cantidadCtrl = new FormControl({ value: '', disabled: this.mode === 'view' });
    tipoCtrl = new FormControl({ value: '', disabled: this.mode === 'view' });
    presionCtrl = new FormControl({ value: '', disabled: this.mode === 'view' });
    bombeosAgregados: Bombeo[] = [];

    precalentamientoUnidades: string[] = ['minutos', 'segundos'];

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) {
        super(fb, router, route, abmPiezaService, dialog);

        this.filteredPrensas$ = this.prensaCtrl.valueChanges.pipe(
            startWith(''),
            switchMap(value => this.prensas$.pipe(
                map(prensas => this._filterPrensas(value, prensas))
            ))
        );
    }

    ngOnInit(): void {
        this.prensas$ = this.abmPiezaService.getPrensas();
        this.tiposBombeo$ = this.abmPiezaService.getTiposBombeo();

        this.moldeo$ = this.abmPiezaService.getMoldeo(this.piezaId);
        this.moldeo$.subscribe(moldeoData => {
            this.moldeoForm.patchValue({
                precalentamientoHabilitado: moldeoData.precalentamientoHabilitado,
                precalentamientoTiempo: moldeoData.precalentamientoTiempo,
                precalentamientoUnidad: moldeoData.precalentamientoUnidad,
                vulcanizacionTiempo: moldeoData.vulcanizacionTiempo,
                vulcanizacionTemperaturaMinima: moldeoData.vulcanizacionTemperaturaMinima,
                vulcanizacionTemperaturaMaxima: moldeoData.vulcanizacionTemperaturaMaxima
            });

            if (moldeoData.precalentamientoHabilitado) {
                this.moldeoForm.get('precalentamientoTiempo').enable();
                this.moldeoForm.get('precalentamientoUnidad').enable();
            } else {
                this.moldeoForm.get('precalentamientoTiempo').disable();
                this.moldeoForm.get('precalentamientoUnidad').disable();
            }

            this.prensasAgregadas = moldeoData.prensaSeleccionada;
            this.actualizarFormularioPrensas();

            this.bombeosAgregados = moldeoData.bombas;
            this.actualizarFormularioBombeos();

            if (this.mode === 'view') {
                this.moldeoForm.disable();
                this.prensaCtrl.disable();
                this.cantidadCtrl.disable();
                this.tipoCtrl.disable();
                this.presionCtrl.disable();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode && !changes.mode.firstChange) {
            const mode = changes.mode.currentValue;

            if (mode === 'view') {
                this.moldeoForm.disable();
                this.prensaCtrl.disable();
                this.cantidadCtrl.disable();
                this.tipoCtrl.disable();
                this.presionCtrl.disable();
            } else {
                this.moldeoForm.enable();
                this.moldeoForm.get('precalentamientoTiempo').disable();
                this.moldeoForm.get('precalentamientoUnidad').disable();
                this.prensaCtrl.enable();
                this.cantidadCtrl.enable();
                this.tipoCtrl.enable();
                this.presionCtrl.enable();
            }
        }
    }

    togglePrecalentamiento(event: MatSlideToggleChange): void {
        const habilitado = event.checked;
        this.moldeoForm.get('precalentamientoHabilitado').setValue(habilitado);

        if (habilitado) {
            this.moldeoForm.get('precalentamientoTiempo').enable();
            this.moldeoForm.get('precalentamientoUnidad').enable();
        } else {
            this.moldeoForm.get('precalentamientoTiempo').disable();
            this.moldeoForm.get('precalentamientoUnidad').disable();
        }
    }

    private _filterPrensas(value: string, prensas: Prensa[]): Prensa[] {
        const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
        return prensas.filter(prensa => prensa.nombre.toLowerCase().includes(filterValue));
    }

    agregarPrensa(): void {
        const prensaValue: Prensa = this.prensaCtrl.value;
        if (prensaValue && !this.prensasAgregadas.find(p => p.id === prensaValue.id)) {
            this.prensasAgregadas.push(prensaValue);
            this.prensaCtrl.setValue(null);
            this.actualizarFormularioPrensas();
        }
    }

    quitarPrensa(prensa: Prensa): void {
        this.prensasAgregadas = this.prensasAgregadas.filter(p => p.id !== prensa.id);
        this.actualizarFormularioPrensas();
    }

    actualizarFormularioPrensas() {
        this.moldeoForm.removeControl('prensasSeleccionadas');
        this.moldeoForm.addControl('prensasSeleccionadas', this.fb.array([]));
        const prensasFormArray = this.moldeoForm.get('prensasSeleccionadas') as FormArray;

        while (prensasFormArray.length !== 0) {
            prensasFormArray.removeAt(0);
        }

        this.prensasAgregadas.forEach(prensa => {
            prensasFormArray.push(this.fb.control(prensa));
        });
    }

    displayFnPrensa(prensa: Prensa): string {
        return prensa && prensa.nombre ? prensa.nombre : '';
    }

    agregarBombeo(): void {
        if (this.cantidadCtrl.value && this.tipoCtrl.value && this.presionCtrl.value) {
            const bombeo: Bombeo = {
                cantidad: this.cantidadCtrl.value,
                tipo: this.tipoCtrl.value,
                presion: this.presionCtrl.value
            };

            this.bombeosAgregados.push(bombeo);
            this.cantidadCtrl.setValue(null);
            this.tipoCtrl.setValue(null);
            this.presionCtrl.setValue(null);
            this.actualizarFormularioBombeos();
        }
    }

    quitarBombeo(index: number): void {
        this.bombeosAgregados.splice(index, 1);
        this.actualizarFormularioBombeos();
    }

    actualizarFormularioBombeos() {
        const bombeosFormArray = this.moldeoForm.get('bombas') as FormArray;
        while (bombeosFormArray.length !== 0) {
            bombeosFormArray.removeAt(0);
        }

        this.bombeosAgregados.forEach(bombeo => {
            bombeosFormArray.push(this.fb.group({
                cantidad: [bombeo.cantidad],
                tipo: [bombeo.tipo],
                presion: [bombeo.presion]
            }));
        });
    }

    guardarMoldeo(): void {
        if (this.moldeoForm.valid) {
            const moldeo: Moldeo = {
                prensaSeleccionada: this.prensasAgregadas,
                precalentamientoHabilitado: this.moldeoForm.get('precalentamientoHabilitado').value,
                precalentamientoTiempo: this.moldeoForm.get('precalentamientoTiempo').value,
                precalentamientoUnidad: this.moldeoForm.get('precalentamientoUnidad').value,
                vulcanizacionTiempo: this.moldeoForm.get('vulcanizacionTiempo').value,
                vulcanizacionTemperaturaMinima: this.moldeoForm.get('vulcanizacionTemperaturaMinima').value,
                vulcanizacionTemperaturaMaxima: this.moldeoForm.get('vulcanizacionTemperaturaMaxima').value,
                bombas: this.bombeosAgregados
            };

            this.abmPiezaService.updateMoldeo(this.piezaId, moldeo).subscribe(() => {
                this.openSnackBar(true, 'Moldeo guardado (mock).', 'green');
                this.abmPiezaService.events.next({
                    mostrarBotonEdicion: true,
                    botonEdicionTexto: 'Guardar Moldeo',
                    nombrePieza: ''
                });
            });
        } else {
            this.openSnackBar(false, 'Por favor, complete todos los campos.');
        }
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

    get bombeoFormCompleto(): boolean {
        return !!(this.cantidadCtrl.value && this.tipoCtrl.value && this.presionCtrl.value);
    }
}