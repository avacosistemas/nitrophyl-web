import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from 'app/shared/services/notification.service';
import { ABMPiezaService } from '../../abm-piezas.service';
import { PiezaDimension } from '../../models/pieza.model';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';

@Component({
    selector: 'app-abm-pieza-dimensiones',
    templateUrl: './abm-pieza-dimensiones.component.html',
    styleUrls: ['./abm-pieza-dimensiones.component.scss']
})
export class ABMPiezaDimensionesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
    @Input() piezaId: number;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    dimensionesForm: FormGroup;
    isLoading: boolean = false;
    private subscription: Subscription = new Subscription();

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        private notificationService: NotificationService,
        public dialog: MatDialog
    ) {
        super(fb, router, route, abmPiezaService, dialog);
        this.initMainForm();
    }

    ngOnInit(): void {
        if (this.piezaId) {
            this.loadDimensiones();
        } else {
            this.initDimensiones(this.dimensionesForm.get('forma').value as 'RECTANGULAR' | 'CIRCULAR');
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.piezaId && changes.piezaId.currentValue) {
            this.loadDimensiones();
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private initMainForm(): void {
        this.dimensionesForm = this.fb.group({
            forma: ['RECTANGULAR', Validators.required],
            dimensiones: this.fb.array([])
        });

        this.subscription.add(
            this.dimensionesForm.get('forma').valueChanges.subscribe(forma => {
                this.initDimensiones(forma);
            })
        );
    }

    get dimensionesArray(): FormArray {
        return this.dimensionesForm.get('dimensiones') as FormArray;
    }

    loadDimensiones(): void {
        if (!this.piezaId) return;
        this.isLoading = true;

        this.subscription.add(
            this.abmPiezaService.getByIdEdicion(this.piezaId).subscribe({
                next: (pieza) => {
                    const forma = pieza.formaDimension || 'RECTANGULAR';
                    const dimensionesData = pieza.dimensiones || [];

                    this.dimensionesForm.patchValue({ forma }, { emitEvent: false });
                    this.initDimensiones(forma, dimensionesData);
                    this.isLoading = false;
                },
                error: (err) => {
                    this.notificationService.showError('Error al cargar las dimensiones.');
                    this.isLoading = false;
                }
            })
        );
    }

    initDimensiones(forma: 'RECTANGULAR' | 'CIRCULAR', existingData: PiezaDimension[] = []): void {
        this.dimensionesArray.clear();
        const tipos = forma === 'RECTANGULAR'
            ? ['ALTO', 'ANCHO', 'PROFUNDIDAD']
            : ['DIAMETRO', 'PROFUNDIDAD'];

        tipos.forEach(tipo => {
            const existing = existingData.find(d => d.tipo === tipo);

            let toleranceData: any = {};
            if (existing?.observaciones) {
                try {
                    toleranceData = JSON.parse(existing.observaciones);
                } catch (e) {
                    console.warn('Could not parse observations JSON for dimension:', existing.tipo);
                }
            }

            const group = this.fb.group({
                id: [existing?.id || null],
                tipo: [tipo],
                controlar: [existing?.controlar || toleranceData.controlar || false],
                valor: [existing?.valor || null, Validators.required],
                margen: [toleranceData.margen || null],
                minimo: [existing?.minimo || toleranceData.minimo || null],
                maximo: [existing?.maximo || toleranceData.maximo || null]
            });

            group.get('margen').valueChanges.subscribe(val => {
                this.calculateMinMax(group, val);
            });

            group.get('valor').valueChanges.subscribe(() => {
                const m = group.get('margen').value;
                if (m != null) this.calculateMinMax(group, m);
            });

            this.dimensionesArray.push(group);
        });
    }

    calculateMinMax(group: FormGroup, margen: number | null): void {
        if (margen == null || margen < 0) return;
        const valor = group.get('valor').value;
        if (valor == null) return;

        const min = parseFloat((valor - margen).toFixed(3));
        const max = parseFloat((valor + margen).toFixed(3));

        group.patchValue({
            minimo: min,
            maximo: max
        }, { emitEvent: false });
    }

    clearMargen(group: FormGroup): void {
        group.get('margen').setValue(null, { emitEvent: false });
    }

    getDimensionesData(): { dimensions: PiezaDimension[], forma: string } {
        const formValue = this.dimensionesForm.getRawValue();
        return {
            dimensions: formValue.dimensiones.map(d => {
                const { id, idPieza, ...rest } = d;
                return rest;
            }),
            forma: formValue.forma
        };
    }

    onSave(): void {
        //
    }

    openConfigurarModal(): void {
        //
    }
}