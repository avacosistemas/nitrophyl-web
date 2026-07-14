import { Component, Inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, startWith, map, switchMap, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { AbmOrdenFabricacionService } from '../../../abm-orden-fabricacion.service';
import { UserService } from 'app/shared/services/user.service';
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

    @ViewChild('loteInput') loteInput!: ElementRef<HTMLInputElement>;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private fb: FormBuilder,
        private _service: AbmOrdenFabricacionService,
        private _userService: UserService,
        public dialogRef: MatDialogRef<RegistrarEntregaDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { saldoPendiente: number, idFormula: number }
    ) {
        this.form = this.fb.group({
            fecha: [new Date(), Validators.required],
            cantidad: [data.saldoPendiente || 0, [Validators.required, Validators.min(1)]],
            lote: [null, Validators.required],
            operario: [null, Validators.required]
        });
    }

    ngOnInit() {
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

        this._userService.getUsersCombo().pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (res) => {
                this.operarios = res.data || [];
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

    private _filterOperarios(value: any): any[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.operarios.filter(o => o.nombre?.toLowerCase().includes(filterValue));
    }

    displayFnLote(lote: any): string {
        return '';
    }

    displayFnOperario(operario: any): string {
        return operario?.nombre || '';
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

    save() {
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

        const result = {
            cantidad: this.form.get('cantidad')!.value,
            fecha: moment(this.form.get('fecha')!.value).format('DD/MM/YYYY'),
            idLote: this.lotesAgregados.map(l => l.id || (l.codigo ? Number(l.codigo) : 0)),
            idUsuario: operario.id || (operario.codigo ? Number(operario.codigo) : 0)
        };

        this.dialogRef.close(result);
    }
}
