import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LotService } from 'app/shared/services/lot.service';
import { FormulasService } from 'app/shared/services/formulas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { IFormula } from 'app/shared/models/formula.interface';
import { ILot } from 'app/shared/models/lot.interface';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

@Component({
    selector: 'app-lot-modal',
    templateUrl: './lot-modal.component.html',
    styleUrls: ['./lot-modal.component.scss']
})
export class LotModalComponent implements OnInit {
    form: FormGroup;
    title: string;
    actionButtonText: string;
    isEditing: boolean = false;
    formulasCreate$: Observable<IFormula[]>;
    formulaFail: boolean = false;
    formulas: IFormula[];

    constructor(
        public dialogRef: MatDialogRef<LotModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder,
        private lotService: LotService,
        private formulaService: FormulasService,
        private _dPipe: DatePipe,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.isEditing = data.isEditing;
        this.title = this.isEditing ? 'Edicion Lote' : 'Nuevo Lote';
        this.actionButtonText = this.isEditing ? 'Guardar' : 'Crear';
        this.createForm();
    }

    ngOnInit(): void {
        this.formulaService
            .get()
            .pipe(
                map((res: any) => (Array.isArray(res.data) ? res.data : [res.data]))
            )
            .subscribe(
                (formulas: IFormula[]) => {
                    this.formulas = formulas;
                    this.formulasCreate$ = this.form.controls['formula'].valueChanges.pipe(
                        startWith(''),
                        map((value: string | IFormula) => {
                            const searchValue =
                                typeof value === 'string' ? value : value?.nombre || '';
                            return searchValue
                                ? this._filter(searchValue)
                                : this.formulas.slice();
                        })
                    );
                },
                (error) => {
                    console.error('Error fetching formulas:', error);
                    this.formulaFail = true;
                }
            );

        if (this.isEditing) {
            this.loadLotData();
        }
    }

    createForm(): void {
        this.form = this.fb.group({
            lot: [
                '',
                [
                    Validators.required,
                    Validators.minLength(5),
                    Validators.maxLength(5),
                    Validators.pattern(/^[a-zA-Z0-9]+$/),
                ],
            ],
            date: [
                this.isEditing ? null : new Date(),
                this.isEditing ? [] : [Validators.required],
            ],
            formula: [null, [this.createFormulaValidator()]],
            observation: ['', Validators.maxLength(255)],
            id: [0],
        });
    }

    loadLotData(): void {
        this.lotService.read(this.data.lotId).subscribe({
            next: (value: any) => {
                const lotData = value.data.body.data;
                const dateParts = lotData.fecha.split('/');
                const dateObject = new Date(
                    +dateParts[2],
                    dateParts[1] - 1,
                    +dateParts[0]
                );

                this.form.patchValue({
                    lot: lotData.nroLote,
                    date: dateObject,
                    formula: this.formulas.find(f => f.id === lotData.idFormula),
                    observation: lotData.observaciones,
                    id: lotData.id,
                });
            },
            error: (error) => {
                console.error('Error loading lot data:', error);
            },
        });
    }

    onAction(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const date: string = this._dPipe.transform(
            this.form.controls['date'].value,
            'dd/MM/yyyy'
        );

        const lot: ILot = {
            id: this.form.controls['id'].value,
            idFormula: this.form.controls['formula'].value.id,
            nroLote: this.form.controls['lot'].value,
            observaciones: this.form.controls['observation'].value || '',
            fecha: date,
            revision: 0,
        };

        if (this.isEditing) {
            this.lotService.put(lot).subscribe({
                next: (response: any) => {
                    if (response.status === 'OK') {
                        this.dialogRef.close({ action: 'edit' });
                    } else {
                        this.openSnackBar(false, response.error);
                    }
                },
                error: (error) => {
                    console.error('Error updating lot:', error);
                    this.openSnackBar(false, 'Error al actualizar el lote.');
                }
            });
        } else {
            this.lotService.post(lot).subscribe({
                next: (response: any) => {
                    if (response.status === 'OK') {
                        this.dialogRef.close({ action: 'create' });
                        this.openSnackBar(true, 'Lote agregado correctamente.');
                    } else {
                        this.openSnackBar(false, response.error);
                    }
                },
                error: (error) => {
                    console.error('Error creating lot:', error);
                    this.openSnackBar(false, 'Error al crear el lote.');
                }
            });
        }
    }

    close(): void {
        if (this.form.dirty) {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: '', boton: 'Cerrar' }
            });

            dialogRef.afterClosed().subscribe((result: boolean) => {
                if (result) {
                    this.dialogRef.close(false);
                }
            });
        } else {
            this.dialogRef.close(false);
        }
    }

    limpiarCampo(campo: string): void {
        this.form.get(campo).reset();
    }

    displayFn(formula: IFormula | null): string {
        return formula ? `${formula.nombre} V${formula.version} (${formula.norma})` : '';
    }

    private _filter(value: string): IFormula[] {
        const filterValue = value.toLowerCase();
        return this.formulas.filter(
            formula =>
                formula.nombre.toLowerCase().includes(filterValue) ||
                formula.version.toString().toLowerCase().includes(filterValue) ||
                formula.norma.toLowerCase().includes(filterValue)
        );
    }

    private createFormulaValidator(): any {
        return (control: FormControl): { [key: string]: any } | null => {
            const valid =
                typeof control.value === 'object' &&
                control.value &&
                control.value.id;
            return valid ? null : { invalidFormula: true };
        };
    }

    private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
        const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
        const defaultCss: string = option ? 'green' : 'red';
        const snackBarMessage = message ? message : defaultMessage;
        const snackBarCss = css ? css : defaultCss;
        const snackBarDuration = duration ? duration : 5000;

        this.snackBar.open(snackBarMessage, 'X', {
            duration: snackBarDuration,
            panelClass: `${snackBarCss}-snackbar`,
        });
    }
}
