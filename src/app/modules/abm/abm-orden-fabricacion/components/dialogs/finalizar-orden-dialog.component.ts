import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { AbmOrdenFabricacionService } from '../../abm-orden-fabricacion.service';
import { Observable, of } from 'rxjs';
import { startWith, switchMap, debounceTime, catchError, map } from 'rxjs/operators';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
    selector: 'app-finalizar-orden-dialog',
    templateUrl: './finalizar-orden-dialog.component.html'
})
export class FinalizarOrdenDialogComponent implements OnInit {
    form: FormGroup;
    filteredLotes$: Observable<any[]>;

    constructor(
        private fb: FormBuilder,
        private _service: AbmOrdenFabricacionService,
        private _dialog: MatDialog,
        public dialogRef: MatDialogRef<FinalizarOrdenDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { saldoPendiente: number, idFormula: number }
    ) {
        this.form = this.fb.group({
            fechaEntregada: [new Date(), Validators.required],
            cantidad: [data.saldoPendiente || 0, [Validators.required, Validators.min(1), Validators.max(data.saldoPendiente || 99999)]],
            lote: [null, Validators.required]
        });
    }

    ngOnInit() {
        console.log('ID Formula recibido en el Dialog:', this.data.idFormula);

        this.filteredLotes$ = this.form.get('lote').valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            switchMap(val => {
                const query = typeof val === 'string' ? val : val?.nombre;

                if (!this.data.idFormula) {
                    return of([]);
                }

                return this._service.getLotes(this.data.idFormula, query || '').pipe(
                    catchError(() => of([]))
                );
            }),
            map(res => res?.data || []) 
        );
    }
    displayFn(lote: any): string { return lote ? lote.nombre : ''; }

    save() {
        if (this.form.invalid) return;

        const cantidad = this.form.get('cantidad').value;
        const saldo = this.data.saldoPendiente;

        if (cantidad > saldo) {
            this._dialog.open(GenericModalComponent, {
                width: '400px',
                data: {
                    title: 'Excedente detectado',
                    message: `La cantidad ingresada (${cantidad}) supera el saldo pendiente (${saldo}). ¿Qué desea hacer con el excedente?`,
                    confirmButtonText: 'Facturar',
                    cancelButtonText: 'Enviar a Stock',
                    showConfirmButton: true,
                    type: 'warning'
                }
            }).afterClosed().subscribe(decision => {
                const excedente = (decision === true) ? 'FACTURA' : 'STOCK';

                if (decision !== undefined) {
                    this.dialogRef.close({
                        ...this.form.value,
                        excedente: excedente
                    });
                }
            });
        } else {
            this.dialogRef.close({
                ...this.form.value,
                excedente: null
            });
        }
    }
}