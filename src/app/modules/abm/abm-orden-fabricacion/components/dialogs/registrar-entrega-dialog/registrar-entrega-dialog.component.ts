import { Component, Inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, startWith, map, switchMap, debounceTime, distinctUntilChanged, catchError, take } from 'rxjs/operators';
import { AbmOrdenFabricacionService } from '../../../abm-orden-fabricacion.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { RemoveDialogComponent } from 'app/shared/components/remove/remove.component';
import moment from 'moment';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';

export const MY_DATE_FORMATS = {
    parse: { dateInput: 'DD/MM/YYYY' },
    display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

export interface IEntregaItem {
    id: number;
    cantidad: number;
    fecha: string;
    lotes: string;
    operario: string;
}

@Component({
    selector: 'app-registrar-entrega-dialog',
    templateUrl: './registrar-entrega-dialog.component.html',
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
    ]
})
export class RegistrarEntregaDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    loteInputCtrl = new FormControl('');
    filteredLotes$!: Observable<any[]>;
    filteredOperarios$!: Observable<any[]>;
    operarios: any[] = [];
    lotesAgregados: any[] = [];

    displayedColumns: string[] = ['fecha', 'cantidad', 'lotes', 'operario', 'acciones'];
    dataSource = new MatTableDataSource<IEntregaItem>([]);
    isLoadingEntregas: boolean = false;
    isSaving: boolean = false;

    @ViewChild('loteInput') loteInput!: ElementRef<HTMLInputElement>;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private fb: FormBuilder,
        private _service: AbmOrdenFabricacionService,
        private _notificationService: NotificationService,
        private _dialog: MatDialog,
        public dialogRef: MatDialogRef<RegistrarEntregaDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            idOrdenFabricacion: number;
            numeroOT?: string | number;
            saldoPendiente: number;
            idFormula: number;
        }
    ) {
        this.form = this.fb.group({
            fecha: [new Date(), Validators.required],
            cantidad: [data.saldoPendiente || 0, [Validators.required, Validators.min(1)]],
            lote: [null, Validators.required],
            operario: [null, Validators.required]
        });
    }

    ngOnInit() {
        this.loadEntregas();

        this.filteredLotes$ = this.loteInputCtrl.valueChanges.pipe(
            startWith(''),
            debounceTime(150),
            distinctUntilChanged(),
            switchMap(val => {
                const query = typeof val === 'string' ? val : '';
                if (!this.data.idFormula) {
                    return of([]);
                }
                return this._service.getLotes(this.data.idFormula, query).pipe(
                    map(res => res?.data || []),
                    catchError(() => of([]))
                );
            })
        );

        this._service.getOperarios().pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (res) => {
                const rawOperarios = res?.data || [];
                this.operarios = rawOperarios.map((o: any) => ({
                    ...o,
                    nombreCompleto: `${o.nombre || ''} ${o.apellido || ''}`.trim() || o.username || 'Operario'
                }));
                this.form.get('operario')!.updateValueAndValidity();
            },
            error: (err) => {
                console.error('Error al cargar operarios:', err);
            }
        });

        this.filteredOperarios$ = this.form.get('operario')!.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOperarios(value))
        );
    }

    loadEntregas(): void {
        if (!this.data.idOrdenFabricacion) return;

        this.isLoadingEntregas = true;
        this._service.getEntregas(this.data.idOrdenFabricacion).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (res) => {
                this.isLoadingEntregas = false;
                const entregas = res?.data || [];
                this.dataSource.data = entregas;
                if (this.paginator) {
                    this.dataSource.paginator = this.paginator;
                }
            },
            error: (err) => {
                this.isLoadingEntregas = false;
                console.error('Error al obtener entregas:', err);
                this._notificationService.showError('Error al cargar las entregas');
            }
        });
    }

    eliminarEntrega(entrega: IEntregaItem): void {
        const dialogRef = this._dialog.open(RemoveDialogComponent, {
            data: {
                seccion: 'Entrega',
                data: `de fecha ${entrega.fecha} (${entrega.cantidad} u.)`,
                boton: 'Eliminar'
            }
        });

        dialogRef.afterClosed().pipe(take(1)).subscribe(confirmed => {
            if (confirmed) {
                this.isLoadingEntregas = true;
                this._service.deleteEntrega(entrega.id).subscribe({
                    next: () => {
                        this._notificationService.showSuccess('Entrega eliminada correctamente');
                        this.loadEntregas();
                    },
                    error: (err) => {
                        this.isLoadingEntregas = false;
                        console.error('Error al eliminar entrega:', err);
                        this._notificationService.showError('Error al eliminar la entrega');
                    }
                });
            }
        });
    }

    private _filterOperarios(value: any): any[] {
        const query = (typeof value === 'string' ? value : (value?.nombreCompleto || value?.nombre || '')).toLowerCase().trim();
        if (!query) {
            return this.operarios;
        }
        return this.operarios.filter(o =>
            o.nombreCompleto?.toLowerCase().includes(query) ||
            o.nombre?.toLowerCase().includes(query) ||
            o.apellido?.toLowerCase().includes(query) ||
            o.username?.toLowerCase().includes(query)
        );
    }

    displayFnLote(lote: any): string {
        return '';
    }

    displayFnOperario(operario: any): string {
        return operario?.nombreCompleto || operario?.nombre || '';
    }

    clearControl(controlName: string): void {
        if (controlName === 'lote') {
            this.lotesAgregados = [];
            this.loteInputCtrl.setValue('');
        }
        this.form.get(controlName)!.setValue(null);
    }

    agregarLote(event: MatAutocompleteSelectedEvent): void {
        const lote = event.option.value;
        if (lote) {
            const isDuplicate = this.lotesAgregados.some(l => {
                const sameId = (l.id !== undefined && l.id !== null && lote.id !== undefined && lote.id !== null) ? l.id === lote.id : false;
                const sameCodigo = (l.codigo !== undefined && l.codigo !== null && lote.codigo !== undefined && lote.codigo !== null) ? l.codigo === lote.codigo : false;
                const sameNombre = l.nombre && lote.nombre ? l.nombre.trim().toLowerCase() === lote.nombre.trim().toLowerCase() : false;
                return sameId || sameCodigo || sameNombre;
            });

            if (!isDuplicate) {
                this.lotesAgregados.push(lote);
                this.form.get('lote')!.setValue(this.lotesAgregados.length > 0 ? this.lotesAgregados : null);
                this.form.get('lote')!.markAsTouched();
            }
        }

        setTimeout(() => {
            if (this.loteInput) {
                this.loteInput.nativeElement.value = '';
            }
            this.loteInputCtrl.setValue('');
        });
    }

    quitarLote(lote: any): void {
        const index = this.lotesAgregados.indexOf(lote);
        if (index >= 0) {
            this.lotesAgregados.splice(index, 1);
            this.form.get('lote')!.setValue(this.lotesAgregados.length > 0 ? this.lotesAgregados : null);
            this.form.get('lote')!.markAsTouched();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    save(): void {
        if (this.form.invalid) return;

        const operario = this.form.get('operario')!.value;

        if (this.lotesAgregados.length === 0) {
            this.form.get('lote')!.setErrors({ required: true });
            return;
        }
        if (!operario || (!operario.id && !operario.codigo)) {
            this.form.get('operario')!.setErrors({ mustSelectOption: true });
            return;
        }

        const idLotes = this.lotesAgregados.map(l => l.id || (l.codigo ? Number(l.codigo) : 0));
        const lotes = this.lotesAgregados.map(l => ({
            id: l.id || (l.codigo ? Number(l.codigo) : 0)
        }));
        const idUsuario = operario.id || (operario.codigo ? Number(operario.codigo) : 0);

        const result = {
            cantidad: Number(this.form.get('cantidad')!.value),
            fecha: moment(this.form.get('fecha')!.value).format('DD/MM/YYYY'),
            idLote: idLotes,
            lotes: lotes,
            idUsuario: idUsuario,
            operario: {
                id: idUsuario
            }
        };

        this.dialogRef.close(result);
    }

    close(): void {
        this.dialogRef.close();
    }
}
