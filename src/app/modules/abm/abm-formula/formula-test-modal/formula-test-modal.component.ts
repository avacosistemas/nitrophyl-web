import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IConfiguracionPruebaParametro, IConditions, ITestFormula } from 'app/shared/models/formula.interface';
import { TestService } from 'app/shared/services/test.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';
import { merge } from 'rxjs';
import { TestModifyDialogComponent } from 'app/modules/prompts/test-modify/test-modify-dialog.component';
import { CheckParamDialogComponent } from 'app/modules/prompts/check-param/check-param-dialog.component';

interface MissingValue {
    nombre: string;
    campo?: string;
}

@Component({
    selector: 'app-formula-test-modal',
    templateUrl: './formula-test-modal.component.html',
})
export class FormulaTestModalComponent implements OnInit {
    formTest: FormGroup;
    selectedIndex: number = 0;
    displayedColumnsParams: string[] = ['name', 'min', 'max', 'norma'];
    displayedColumnsConditions: string[] = [];
    params$: any[] = [];
    conditions$: any;
    isEditing: boolean = false;
    mostrarResultadosReporte: boolean;

    constructor(
        public dialogRef: MatDialogRef<FormulaTestModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private formBuilder: FormBuilder,
        private _configTest: ConfigTestService,
        private _testService: TestService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        if (this.data.testId) {
            this.loadTest(this.data.testId);
        } else if (this.data.machineId) {
            this.addMachine(this.data.machineId, this.data.machineNorma);
        }
    }

    onClose(): void {
        this.dialogRef.close();
    }

    editTest(): void {
        const dialogRef = this.dialog.open(TestModifyDialogComponent, {
            width: '450px',
            data: {
                type: 'edit'
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.isEditing = true;
                this.formTest.enable();
                this.displayedColumnsConditions = ['condition', 'value', 'actions'];
            }
        });
    }

    saveTestModify(): void {
        const { body, missingValues } = this.prepareTestForPut();

        if (!body) {
            return;
        }

        const openModifyDialog = (): void => {
            const dialogRef = this.dialog.open(TestModifyDialogComponent, {
                width: '450px',
                data: { type: 'save' },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    this.putTest(body);
                    this.isEditing = false;
                }
            });
        };

        if (missingValues.length > 0) {
            const dialogRef = this.dialog.open(CheckParamDialogComponent, {
                width: '500px',
                data: { params: missingValues },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    openModifyDialog();
                }
            });
        } else {
            openModifyDialog();
        }
    }

    public saveTest(): void {
        const body: ITestFormula = {
            idFormula: this.data.id,
            idMaquina: this.data.machineId,
            parametros: [],
            condiciones: [],
            observacionesReporte: this.formTest.controls['observacionesReporte'].value || null,
            mostrarResultadosReporte: this.mostrarResultadosReporte || false,
        };

        const controls = this.formTest?.controls;
        if (!controls) {
            console.error('El formulario no está inicializado correctamente');
            return;
        }

        const missingValues: MissingValue[] = [];
        const missingMinMax: { [nombre: string]: { min: boolean; max: boolean } } = {};

        for (const param of this.params$) {
            const minControl = controls[`${param.id}.min`];
            const maxControl = controls[`${param.id}.max`];
            const normaControl = controls[`${param.id}.norma`];

            if (!minControl || !maxControl) {
                this.openSnackBar(false, `Error al procesar el parámetro '${param.nombre}'`);
                return;
            }

            const minvparam = minControl.value;
            const maxvparam = maxControl.value;

            if (minvparam === null || minvparam === '') {
                if (!missingMinMax[param.nombre]) {
                    missingMinMax[param.nombre] = { min: false, max: false };
                }
                missingMinMax[param.nombre].min = true;
            }
            if (maxvparam === null || maxvparam === '') {
                if (!missingMinMax[param.nombre]) {
                    missingMinMax[param.nombre] = { min: false, max: false };
                }
                missingMinMax[param.nombre].max = true;
            }

            const minvparamnum = Number(minvparam);
            const maxvparamnum = Number(maxvparam);

            if (
                minvparam !== null &&
                maxvparam !== null &&
                minvparam.toString().trim().length > 0 &&
                maxvparam.toString().trim().length > 0 &&
                minvparamnum > maxvparamnum
            ) {
                this.openSnackBar(false, `El valor mínimo del parámetro '${param.nombre}' no puede ser mayor al valor máximo.`);
                return;
            }

            body.parametros.push({
                id: null,
                maquinaPrueba: {
                    id: param.id,
                    nombre: param.nombre,
                },
                minimo: minvparam,
                maximo: maxvparam,
                norma: normaControl?.value || null,
            });
        }

        for (const condition of this.conditions$) {
            const controlName = `${condition.nombre}.value`;
            const controlValue = controls[controlName]?.value;

            body.condiciones.push({
                id: condition.id || null,
                nombre: condition.nombre,
                valor: controlValue,
            });
        }

        for (const prueba in missingMinMax) {
            if (missingMinMax.hasOwnProperty(prueba)) {
                const missing = missingMinMax[prueba];
                let campo = '';
                if (missing.min && missing.max) {
                    campo = 'mínimo y máximo';
                } else if (missing.min) {
                    campo = 'mínimo';
                } else if (missing.max) {
                    campo = 'máximo';
                }
                missingValues.push({ nombre: prueba, campo });
            }
        }

        if (missingValues.length > 0) {
            this.openDialogForMissingValues(missingValues, body);
            return;
        }

        this.saveTestRequest(body);
    }

    addCondition(): void {
        const condition = this.formTest.controls.condition.value;

        if (!condition || typeof condition !== 'string') {
            console.error('El valor de condition no es válido:', condition);
            return;
        }

        if (this.conditions$.some((c: { nombre: string }) => c.nombre === condition)) {
            return;
        }

        this.formTest.addControl(`${condition}.value`, new FormControl(null));
        this.conditions$.push({
            nombre: condition,
            valor: null
        });

        this.conditions$ = [...this.conditions$];
        this.formTest.controls.condition.setValue(null);
    }

    deleteCondition(row: any): void {
        this.formTest.removeControl(row);
        this.conditions$ = this.conditions$.filter((x: any) => x !== row);
    }

    private openDialogForMissingValues(missingValues: MissingValue[], body: ITestFormula): void {
        const dialogRef = this.dialog.open(CheckParamDialogComponent, {
            width: '500px',
            data: { params: missingValues },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.saveTestRequest(body);
            }
        });
    }

    private saveTestRequest(body: ITestFormula): void {
        this.postMachine(body);
    }

    private postMachine(body: ITestFormula): void {
        const error: string = 'formula-test-modal.component.ts => postTest() => ';
        this._configTest.post(body).subscribe({
            next: () => {
                this.dialogRef.close(true);
                this.openSnackBar(true);
            },
            error: (err: any) => {
                console.error(error, err);
                this.openSnackBar(false);
            },
            complete: () => { },
        });
    }

    private addMachine(id: number, machineNorma: string): void {
        const error: string = 'formula-test-modal.component.ts => addMachine() => ';
        this._testService.getTest(id).subscribe({
            next: (res: any) => {
                this.formTest.enable();

                this.formTest = this.formBuilder.group({
                    condition: [null],
                    observacionesReporte: [null]
                });
                this.displayedColumnsConditions = ['condition', 'value', 'actions'];
                this.params$ = [];
                this.conditions$ = [];

                for (const param of res.data) {
                    this.params$.push(param);
                    this.formTest.addControl(`${param.id}.min`, new FormControl(null));
                    this.formTest.addControl(`${param.id}.max`, new FormControl(null));

                    const normaControl = new FormControl(machineNorma);
                    this.formTest.addControl(`${param.id}.norma`, normaControl);

                    this.configureValidators(param.id);
                }

                this.params$ = [...this.params$];
                this.selectedIndex = 0;
            },
            error: (err: any) => console.error(error, err),
            complete: () => { },
        });
    }

    private configureValidators(param: string): void {
        const controls = this.formTest.controls;
        const pattern: RegExp = /^\d+(\.\d{1,4})?$/;

        const min = controls[param + '.min'];
        const max = controls[param + '.max'];

        merge(min.valueChanges, max.valueChanges).subscribe(() => {
            if (min.value && max.value) {
                if (!pattern.test(min.value) || !pattern.test(max.value)) {
                    if (!pattern.test(min.value)) {
                        min.setErrors({ pattern: true });
                    } else {
                        min.setErrors(null);
                    }
                    if (!pattern.test(max.value)) {
                        max.setErrors({ pattern: true });
                    } else {
                        max.setErrors(null);
                    }
                } else {
                    const minVal: number = parseFloat(min.value);
                    const maxVal: number = parseFloat(max.value);
                    if (minVal > maxVal) {
                        max.setErrors({ max: true });
                    } else {
                        max.setErrors(null);
                    }
                }
            } else {
                if (min.value) {
                    if (!pattern.test(min.value)) {
                        min.setErrors({ pattern: true });
                    } else {
                        min.setErrors(null);
                    }
                }
                if (max.value) {
                    if (!pattern.test(max.value)) {
                        max.setErrors({ pattern: true });
                    } else {
                        max.setErrors(null);
                    }
                }
            }
        });
    }

    private setValues(
        params: IConfiguracionPruebaParametro[],
        conditions: IConditions[],
        observacionesReporte: string,
        mostrarResultadosReporte: boolean
    ): void {
        this.params$ = [];
        for (const param of params) {
            this.formTest.addControl(
                `${param.maquinaPrueba.id}.min`,
                new FormControl(param.minimo)
            );
            this.formTest.addControl(
                `${param.maquinaPrueba.id}.max`,
                new FormControl(param.maximo)
            );
            this.formTest.addControl(
                `${param.maquinaPrueba.id}.norma`,
                new FormControl(param.norma)
            );
            this.params$.push({
                id: param.maquinaPrueba.id,
                nombre: param.maquinaPrueba.nombre,
                testParamId: param.id,
                position: param.maquinaPrueba.posicion,
                orden: param.orden,
                min: param.minimo,
                max: param.maximo,
                norma: param.norma
            });
        }
        this.params$ = [...this.params$];

        this.conditions$ = [];
        for (const condition of conditions) {
            this.formTest.addControl(
                `${condition.nombre}.value`,
                new FormControl(condition.valor)
            );
            this.conditions$.push(condition);
        }
        this.conditions$ = [...this.conditions$];

        this.formTest.controls['observacionesReporte'].setValue(observacionesReporte);
        this.mostrarResultadosReporte = mostrarResultadosReporte;
    }

    private prepareTestForPut(): { body: ITestFormula | null; missingValues: { nombre: string }[] } {
        const body: ITestFormula = {
            id: this.data.currentTestId,
            parametros: [],
            condiciones: [],
            observacionesReporte: this.formTest.controls['observacionesReporte'].value || null,
        };

        const controls = this.formTest.controls;
        const missingValues: MissingValue[] = [];
        const missingMinMax: { [nombre: string]: { min: boolean; max: boolean } } = {};

        for (const param of this.params$) {
            const minControl = controls[param.id + '.min'];
            const maxControl = controls[param.id + '.max'];
            const normaControl = controls[param.id + '.norma'];

            const minValue = minControl.value !== null && minControl.value !== '' ? Number(minControl.value) : null;
            const maxValue = maxControl.value !== null && maxControl.value !== '' ? Number(maxControl.value) : null;

            const minvparam = minControl.value;
            const maxvparam = maxControl.value;

            if (minvparam === null || minvparam === '') {
                if (!missingMinMax[param.nombre]) {
                    missingMinMax[param.nombre] = { min: false, max: false };
                }
                missingMinMax[param.nombre].min = true;
            }
            if (maxvparam === null || maxvparam === '') {
                if (!missingMinMax[param.nombre]) {
                    missingMinMax[param.nombre] = { min: false, max: false };
                }
                missingMinMax[param.nombre].max = true;
            }

            if (minValue !== null && maxValue !== null && minValue > maxValue) {
                this.openSnackBar(false, `El valor mínimo del parámetro '${param.nombre}' no puede ser mayor al valor máximo.`);
                return { body: null, missingValues: [] };
            }

            body.parametros.push({
                id: param.testParamId || null,
                maquinaPrueba: {
                    id: param.id,
                    posicion: param.position,
                },
                minimo: minValue,
                maximo: maxValue,
                norma: normaControl?.value || null,
                orden: param.orden,
            });
        }

        for (const condition of this.conditions$) {
            const controlName = `${condition.nombre}.value`;
            const controlValue = controls[controlName]?.value;

            const valor = controlValue !== null && controlValue !== '' ? Number(controlValue) : null;

            body.condiciones.push({
                id: condition.id || null,
                nombre: condition.nombre,
                valor: valor,
            });
        }

        for (const prueba in missingMinMax) {
            if (missingMinMax.hasOwnProperty(prueba)) {
                const missing = missingMinMax[prueba];
                let campo = '';
                if (missing.min && missing.max) {
                    campo = 'mínimo y máximo';
                } else if (missing.min) {
                    campo = 'mínimo';
                } else if (missing.max) {
                    campo = 'máximo';
                }
                missingValues.push({ nombre: prueba, campo });
            }
        }

        return { body, missingValues };
    }

    private putTest(body: ITestFormula): void {
        const error: string = 'formula-test-modal.component.ts => putTest() => ';
        this._configTest.put(body).subscribe({
            next: () => {
                this.dialogRef.close(true);
                this.openSnackBar(true, 'Prueba actualizada exitosamente');
                this.formTest.disable();
            },
            error: (err: any) => {
                console.error(error, err);
                this.openSnackBar(false, 'No se pudo actualizar la prueba');
            },
            complete: () => { },
        });
    }

    private initializeForm(): void {
        this.formTest = this.formBuilder.group({
            condition: [null],
            observacionesReporte: [null]
        });
    }

    private loadTest(testId: number): void {
        const error: string = 'formula-test-modal.component.ts => getTest() => ';
        this._configTest.get(testId).subscribe({
            next: (res: any) => {
                this.displayedColumnsConditions = ['condition', 'value'];
                this.setValues(
                    res.data.parametros,
                    res.data.condiciones,
                    res.data.observacionesReporte,
                    res.data.mostrarResultadosReporte
                );
                this.formTest.disable();
                this.data.machine = res.data.maquina;
                this.selectedIndex = 0;
            },
            error: (err: any) => console.error(error, err),
            complete: () => { },
        });
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
