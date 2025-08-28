import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Prensa, Bombeo, Moldeo, PiezaProceso } from '../../models/pieza.model';
import { Observable, of, Subject, merge } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { startWith, map, switchMap, debounceTime, catchError, filter } from 'rxjs/operators';

@Component({
    selector: 'app-abm-pieza-moldeo',
    templateUrl: './abm-pieza-moldeo.component.html',
    styleUrls: ['./abm-pieza-moldeo.component.scss']
})
export class ABMPiezaMoldeoComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
    @Input() piezaId: number;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';
    @Input() piezaProcesoData: PiezaProceso | null = null;
    @ViewChild('prensaInput') prensaInput: ElementRef<HTMLInputElement>;

    prensasDisponibles$: Observable<Prensa[]>;

    tiposBombeo: string[] = ['AUTOMATICO', 'ESCALONADO', 'A FONDO'];

    moldeoForm = this.fb.group({
        precalentamientoHabilitado: [false],
        precalentamientoTiempo: [{ value: null, disabled: true }],
        precalentamientoUnidad: [{ value: 'minutos', disabled: true }],
        vulcanizacionTiempo: [null, Validators.required],
        vulcanizacionTemperaturaMinima: [null, Validators.required],
        vulcanizacionTemperaturaMaxima: [null, Validators.required],
        bombas: this.fb.array([]),
        prensasSeleccionadas: this.fb.array([])
    });

    prensaCtrl = new FormControl('');
    prensasAgregadas: Prensa[] = [];
    filteredPrensas$: Observable<Prensa[]>;

    cantidadCtrl = new FormControl(null, Validators.required);
    tipoCtrl = new FormControl(null, Validators.required);
    presionCtrl = new FormControl(null);
    bombeosAgregados: Bombeo[] = [];

    precalentamientoUnidades: string[] = ['minutos', 'segundos'];

    private refreshPrensas$ = new Subject<void>();

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private notificationService: NotificationService,
        public dialog: MatDialog
    ) {
        super(fb, router, route, abmPiezaService, dialog);
    }

    ngOnInit(): void {
        const prensasTriggers$ = merge(
            this.prensaCtrl.valueChanges,
            this.refreshPrensas$
        );

        this.filteredPrensas$ = prensasTriggers$.pipe(
            startWith(''),
            debounceTime(300),
            switchMap(() => {
                const searchTerm = typeof this.prensaCtrl.value === 'string' ? this.prensaCtrl.value : '';

                return this.abmPiezaService.getPrensas().pipe(
                    map(response => response || []),
                    map(prensasDesdeApi =>
                        prensasDesdeApi.filter(prensaApi =>
                            !this.prensasAgregadas.some(prensaAgregada => prensaAgregada.id === prensaApi.id)
                        )
                    ),
                    catchError(() => of([]))
                );
            })
        );

        if (this.mode === 'view') {
            this.disableAllControls();
        }

        this.moldeoForm.get('precalentamientoHabilitado').valueChanges.subscribe(habilitado => {
            this.togglePrecalentamientoControls(habilitado);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.piezaProcesoData && changes.piezaProcesoData.currentValue) {
            this.patchMoldeoForm(changes.piezaProcesoData.currentValue);
        }

        if (changes.mode) {
            if (this.mode === 'view') {
                this.disableAllControls();
            } else {
                this.enableAllControls();
            }
        }
    }

    private patchMoldeoForm(data: PiezaProceso): void {
        if (!data) return;

        const precalentamientoHabilitado = !!data.precalentamientoValor && data.precalentamientoValor > 0;

        this.moldeoForm.patchValue({
            precalentamientoHabilitado: precalentamientoHabilitado,
            precalentamientoTiempo: data.precalentamientoValor,
            precalentamientoUnidad: data.precalentamientoUnidad || 'minutos',
            vulcanizacionTiempo: data.vulcanizacionTiempo,
            vulcanizacionTemperaturaMinima: data.vulcanizacionTemperaturaMin,
            vulcanizacionTemperaturaMaxima: data.vulcanizacionTemperaturaMax,
        });

        this.prensasAgregadas = data.prensas || [];
        this.actualizarFormularioPrensas();

        this.bombeosAgregados = data.bombeos || [];
        this.actualizarFormularioBombeos();
    }

    private disableAllControls(): void {
        this.moldeoForm.disable();
        this.prensaCtrl.disable();
        this.cantidadCtrl.disable();
        this.tipoCtrl.disable();
        this.presionCtrl.disable();
    }

    private enableAllControls(): void {
        this.moldeoForm.enable();
        this.togglePrecalentamientoControls(this.moldeoForm.get('precalentamientoHabilitado').value);
        this.prensaCtrl.enable();
        this.cantidadCtrl.enable();
        this.tipoCtrl.enable();
        this.presionCtrl.enable();
    }

    togglePrecalentamientoControls(habilitado: boolean): void {
        if (this.mode === 'view') return;
        if (habilitado) {
            this.moldeoForm.get('precalentamientoTiempo').enable();
            this.moldeoForm.get('precalentamientoUnidad').enable();
        } else {
            this.moldeoForm.get('precalentamientoTiempo').disable();
            this.moldeoForm.get('precalentamientoUnidad').disable();
        }
    }

    private _filterPrensas(value: any, prensas: Prensa[]): Prensa[] {
        const filterValue = (typeof value === 'string' ? value : value?.nombre || '').toLowerCase();
        return prensas.filter(prensa => prensa.nombre.toLowerCase().includes(filterValue));
    }

    agregarPrensa(event: MatAutocompleteSelectedEvent): void {
        const prensaValue: Prensa = event.option.value;

        if (prensaValue && typeof prensaValue === 'object' && !this.prensasAgregadas.some(p => p.id === prensaValue.id)) {
            this.prensasAgregadas.push(prensaValue);
            this.actualizarFormularioPrensas();
            this.moldeoForm.markAsDirty();
        }

        if (this.prensaInput) {
            this.prensaInput.nativeElement.value = '';
        }
        this.prensaCtrl.setValue(null);
    }

    quitarPrensa(prensa: Prensa): void {
        const index = this.prensasAgregadas.findIndex(p => p.id === prensa.id);
        if (index >= 0) {
            this.prensasAgregadas.splice(index, 1);
            this.actualizarFormularioPrensas();
            this.moldeoForm.markAsDirty();
            this.refreshPrensas$.next();
        }
    }


    actualizarFormularioPrensas() {
        const prensasFormArray = this.moldeoForm.get('prensasSeleccionadas') as FormArray;
        prensasFormArray.clear();
        this.prensasAgregadas.forEach(prensa => {
            prensasFormArray.push(this.fb.control(prensa));
        });
    }

    displayFnPrensa(prensa: Prensa): string {
        return '';
    }

    agregarBombeo(): void {
        if (this.cantidadCtrl.valid && this.tipoCtrl.valid) {
            this.bombeosAgregados.push({
                cantidad: this.cantidadCtrl.value,
                tipo: this.tipoCtrl.value,
                presion: this.presionCtrl.value
            });
            this.cantidadCtrl.reset(); this.tipoCtrl.reset(); this.presionCtrl.reset();
            this.actualizarFormularioBombeos();
            this.moldeoForm.markAsDirty();
        } else {
            this.notificationService.showError('Por favor, complete la cantidad y el tipo de bombeo.');
        }
    }

    quitarBombeo(index: number): void {
        this.bombeosAgregados.splice(index, 1);
        this.actualizarFormularioBombeos();
        this.moldeoForm.markAsDirty();
    }

    actualizarFormularioBombeos() {
        const bombeosFormArray = this.moldeoForm.get('bombas') as FormArray;
        bombeosFormArray.clear();
        this.bombeosAgregados.forEach(bombeo => {
            bombeosFormArray.push(this.fb.group({
                cantidad: [bombeo.cantidad],
                tipo: [bombeo.tipo],
                presion: [bombeo.presion]
            }));
        });
    }

    public guardarMoldeo(): void {
        if (this.moldeoForm.invalid) {
            this.notificationService.showError('Por favor, complete todos los campos requeridos de Moldeo.');
            return;
        }
        if (!this.piezaId) {
            this.notificationService.showError('No se ha identificado la pieza para guardar.');
            return;
        }

        const formValues = this.moldeoForm.getRawValue();
        const dto = {
            precalentamientoValor: formValues.precalentamientoHabilitado ? formValues.precalentamientoTiempo : null,
            precalentamientoUnidad: formValues.precalentamientoHabilitado ? formValues.precalentamientoUnidad : null,
            prensas: this.prensasAgregadas.map(p => p.id),
            vulcanizacionTemperaturaMax: formValues.vulcanizacionTemperaturaMaxima,
            vulcanizacionTemperaturaMin: formValues.vulcanizacionTemperaturaMinima,
            vulcanizacionTiempo: formValues.vulcanizacionTiempo,
            bombeos: this.bombeosAgregados.map(b => ({ cantidad: b.cantidad, presion: b.presion, tipo: b.tipo }))
        };

        this.abmPiezaService.updateMoldeo(this.piezaId, dto).subscribe({
            next: () => {
                this.notificationService.showSuccess('Moldeo guardado correctamente.');
                this.moldeoForm.markAsPristine();
            },
            error: (err) => {
                console.error('Error al guardar Moldeo', err);
                this.notificationService.showError('Error al guardar los datos de Moldeo.');
            }
        });
    }

    get bombeoFormCompleto(): boolean {
        return !!(this.cantidadCtrl.value && this.tipoCtrl.value);
    }
}