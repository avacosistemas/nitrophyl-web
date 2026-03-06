import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';

@Component({
    selector: 'app-asignar-prensa-dialog',
    templateUrl: './asignar-prensa-dialog.component.html',
})
export class AsignarPrensaDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    currentTotal: number = 0;

    totalColorClass: string = 'bg-gray-100 border-gray-200';
    totalTextClass: string = 'text-gray-800';

    filteredOperarios$: Observable<any[]>;
    operarios: any[] = [
        { id: 1, nombre: 'Juan Pérez' },
        { id: 2, nombre: 'Ana García' },
        { id: 3, nombre: 'Carlos López' },
        { id: 4, nombre: 'Roberto Gómez' },
        { id: 5, nombre: 'Luisa Fernández' }
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AsignarPrensaDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            cantidadSolicitada: number,
            stockDisponible: number,
            sugeridoFabrica: number,
            sugeridoStock: number,
            fechaEstimada: string
        }
    ) {
        const suggestedStock = Math.min(data.cantidadSolicitada, data.stockDisponible);
        const suggestedFabrica = Math.max(0, data.cantidadSolicitada - suggestedStock);

        this.form = this.fb.group({
            cantFabrica: [suggestedFabrica, [Validators.required, Validators.min(0)]],
            cantStock: [suggestedStock, [Validators.required, Validators.min(0), Validators.max(data.stockDisponible)]],
            maquina: ['', Validators.required],
            operario: ['']
        });
    }

    ngOnInit(): void {
        this.calculateTotal();

        this.form.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.calculateTotal();
            });

        this.filteredOperarios$ = this.form.get('operario').valueChanges.pipe(
            startWith(''),
            map(value => this._filterOperarios(value))
        );
    }

    private _filterOperarios(value: any): any[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.operarios.filter(o => o.nombre.toLowerCase().includes(filterValue));
    }

    displayFn(operario: any): string {
        return operario?.nombre || '';
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    calculateTotal(): void {
        const fabrica = this.form.get('cantFabrica').value || 0;
        const stock = this.form.get('cantStock').value || 0;

        this.currentTotal = fabrica + stock;
        const solicitada = this.data.cantidadSolicitada || 0;

        if (this.currentTotal === solicitada) {
            this.totalColorClass = 'bg-green-100 border-green-200';
            this.totalTextClass = 'text-green-800';
        } else if (this.currentTotal < solicitada) {
            this.totalColorClass = 'bg-red-100 border-red-200';
            this.totalTextClass = 'text-red-800';
        } else {
            this.totalColorClass = 'bg-yellow-100 border-yellow-200';
            this.totalTextClass = 'text-yellow-800';
        }
    }

    save() {
        if (this.form.valid) {
            const result = {
                ...this.form.value,
                fechaEstimada: this.data.fechaEstimada
            };
            this.dialogRef.close(result);
        }
    }
}