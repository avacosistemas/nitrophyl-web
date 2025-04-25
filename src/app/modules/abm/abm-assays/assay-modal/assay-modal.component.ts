import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { AssayService } from 'app/shared/services/assay.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IAssay, IAssayCreate, IAssayDetail, IAssayDetailsResponse, IAssayDetailResponse } from 'app/shared/models/assay.interface';
import { IConfigTest, IParams } from 'app/shared/models/config-test.interface';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { map } from 'rxjs';
import { DateAdapter } from '@angular/material/core';
import { AssayDialogComponent } from '../assay-dialog/assay-dialog.component';
import { AssayDialogAlertComponent } from '../assay-dialog-alert/assay-dialog-alert.component';

interface Icon {
    color: string;
    icon: string;
    tooltip?: string;
}

@Component({
    selector: 'app-assay-modal',
    templateUrl: './assay-modal.component.html',
    styleUrls: ['./assay-modal.component.scss']
})
export class AssayModalComponent implements OnInit {
    form: FormGroup;
    title: string;
    mode: string;
    lotId: number;
    machineId: number;
    assayData: IAssay;
    selectedAssayId: number;
    public machineName: string;

    public paramsArray: AbstractControl[];
    public assay: IConfigTest;
    public assay$: any;
    public displayedColumnsAssay: string[] = [
        'nombre',
        'minimo',
        'maximo',
        'resultado',
        'redondeo',
        'estado',
    ];

    public assayObservations: string;
    private icons: { [key: string]: Icon } = {
        green: { color: 'green', icon: 'check_circle' },
        yellow: { color: 'yellow', icon: 'warning' },
        red: { color: 'red', icon: 'error' },
        help: { color: 'grey', icon: 'help', tooltip: 'datos inválidos' },
    };

    constructor(
        public dialogRef: MatDialogRef<AssayModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder,
        private assayService: AssayService,
        private configTestService: ConfigTestService,
        private snackBar: MatSnackBar,
        private _dPipe: DatePipe,
        private dialog: MatDialog,
        private dateAdapter: DateAdapter<Date>
    ) {
        this.dateAdapter.setLocale('es');
    }

    ngOnInit(): void {
        this.mode = this.data.mode;
        this.lotId = this.data.lotId;
        this.machineId = this.data.machineId;
        this.assayData = this.data.assay;
        this.machineName = this.data.machineName;

        if (this.mode === 'create') {
            this.title = `Nuevo ensayo de ${this.machineName}`;
            this._get();
            this.form = this.fb.group({
                fecha: new FormControl(new Date(), Validators.required),
                params: this.fb.array([]),
            });
        } else if (this.mode === 'view') {
            this.title = `Ver Ensayo ${this.assayData?.maquina}`;
            this.assayObservations = this.assayData?.observaciones;
            this.assay$ = this.assayService
                .getAssay(this.machineId)
                .pipe(
                    map((res: IAssayDetailResponse | IAssayDetailsResponse) =>
                        Array.isArray(res.data) ? res.data : [res.data]
                    )
                );
        } else if (this.mode === 'edit') {
            this.title = `Editar Ensayo ${this.assayData?.maquina}`;
            this.selectedAssayId = this.assayData.id;
            this._getAssayForEdit(this.assayData.id);
        }
    }

    icon(element: AbstractControl | IAssayDetail): any {
        let min: number | null;
        let max: number | null;
        let result: number | null;
        let round: number | null;

        if (element instanceof AbstractControl) {
            min = element.get('minimo')?.value;
            max = element.get('maximo')?.value;
            result = element.get('resultado')?.value;
            round = element.get('redondeo')?.value;
        } else {
            min = element.minimo;
            max = element.maximo;
            result = element.resultado;
            round = element.redondeo;
        }

        if (this._range(round, min, max) && round === result) {
            return this.icons.green;
        } else if (this._range(round, min, max) && round !== result) {
            return this.icons.yellow;
        } else if (!this._range(round, min, max) && round === result) {
            return this.icons.red;
        }
        return this.icons.help;
    }

    save(): void {
        this.openSaveConfirmation(() => {
            if (this.form.invalid) {
                this.form.markAllAsTouched();
                return;
            }

            let failed: boolean = false;

            const date: string = this._dPipe.transform(
                this.form.controls['fecha'].value,
                'dd/MM/yyyy'
            );

            const assay: IAssayCreate = {
                idLote: this.lotId,
                idConfiguracionPrueba: this.machineId,
                fecha: date,
                observaciones: '',
                estado: '',
                resultados: this.form
                    .get('params')
                    .value.map((param: IParams, index: number) => {
                        if (
                            (param.minimo === null || param.redondeo < param.minimo) &&
                            (param.maximo === null || param.redondeo > param.maximo) &&
                            param.resultado !== null &&
                            param.redondeo !== param.resultado
                        ) {
                            this._snackBar(false, param.maquinaPrueba.nombre);
                            failed = true;
                            return;
                        }
                        return {
                            idConfiguracionPruebaParametro: Number(
                                this.assay.parametros[index].id
                            ),
                            redondeo: Number(param.redondeo),
                            resultado: Number(param.resultado),
                            nombre: param.nombre,
                            maximo: Number(param.maximo),
                            minimo: Number(param.minimo),
                        };
                    }),
            };

            if (!failed) {
                this._dialog(assay);
            }
        });
    }

    update(): void {
        this.openUpdateConfirmation(() => {
            if (this.form.invalid) {
                this.form.markAllAsTouched();
                return;
            }

            let failed: boolean = false;

            const date: string = this._dPipe.transform(
                this.form.controls['fecha'].value,
                'dd/MM/yyyy'
            );

            this.assayService.get(this.lotId).subscribe({
                next: (assayRes: any) => {
                    const assayDataResponse = Array.isArray(assayRes.data) ? assayRes.data : [assayRes.data];

                    const selectedAssay = assayDataResponse.find(assay => assay.id === this.assayData.id);

                    if (!selectedAssay) {
                        console.error('Assay not found for ID:', this.selectedAssayId);
                        this._snackBar(false, 'Ensayo no encontrado');
                        return;
                    }

                    const ensayoDTO: any = {
                        id: this.assayData.id,
                        idLote: Number(this.lotId),
                        idConfiguracionPrueba: selectedAssay.idConfiguracionPrueba,
                        fecha: date,
                        observaciones: this.form.get('observaciones')?.value || '',
                        estado: '',
                        maquina: this.assayData.maquina,
                        resultados: this.form
                            .get('params')
                            .value.map((param: any) => {
                                if (
                                    (param.minimo === null || param.redondeo < param.minimo) &&
                                    (param.maximo === null || param.redondeo > param.maximo) &&
                                    param.resultado !== null &&
                                    param.redondeo !== param.resultado
                                ) {
                                    this._snackBar(false, param.nombre);
                                    failed = true;
                                    return;
                                }

                                return {
                                    id: param.id,
                                    idEnsayo: param.idEnsayo,
                                    idConfiguracionPruebaParametro: param.idConfiguracionPruebaParametro,
                                    nombre: param.nombre,
                                    minimo: param.minimo,
                                    maximo: param.maximo,
                                    resultado: Number(param.resultado),
                                    redondeo: Number(param.redondeo),
                                    norma: param.norma
                                };
                            }).filter(result => result !== undefined),
                    };

                    if (!failed) {
                        this._dialogUpdate(ensayoDTO);
                    }
                },
                error: (err: any) => {
                    console.error('update() =>', err);
                    this._snackBar(false, 'Error al cargar la información del ensayo');
                }
            });
        });
    }

    private _getAssayForEdit(assayId: number): void {
        const error: string = 'abm-assays => assays.component.ts => _getAssayForEdit() =>';

        this.form = this.fb.group({
            fecha: [null, Validators.required],
            params: this.fb.array([]),
            observaciones: ['']
        });

        this.assayService.get(this.lotId).subscribe({
            next: (assayRes: any) => {
                const assayDataResponse = Array.isArray(assayRes.data) ? assayRes.data : [assayRes.data];

                const selectedAssay = assayDataResponse.find(assay => assay.id === assayId);

                if (!selectedAssay) {
                    console.error('Assay not found for ID:', this.selectedAssayId);
                    this._snackBar(false, 'Ensayo no encontrado');
                    return;
                }

                this.form.controls['fecha'].setValue(this._parseDate(selectedAssay.fecha));
                this.form.controls['observaciones'].setValue(selectedAssay.observaciones);

                this.assayService.getAssay(assayId).subscribe({
                    next: (assayDetailsRes: IAssayDetailsResponse | IAssayDetailResponse) => {
                        const assayDetails = Array.isArray(assayDetailsRes.data) ? assayDetailsRes.data : [assayDetailsRes.data];

                        const formGroups = assayDetails.map(detail => {
                            const group = this.fb.group({
                                id: [detail.id],
                                idEnsayo: [detail.idEnsayo],
                                idConfiguracionPruebaParametro: [detail.idConfiguracionPruebaParametro],
                                nombre: [detail.nombre],
                                minimo: [detail.minimo],
                                maximo: [detail.maximo],
                                resultado: [
                                    detail.resultado,
                                    [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)]
                                ],
                                redondeo: [
                                    detail.redondeo,
                                    [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)]
                                ],
                                norma: [detail.norma]
                            });

                            group.get('resultado').valueChanges.subscribe((value) => {
                                group.get('redondeo').setValue(value, { emitEvent: false });
                            });

                            return group;
                        });

                        (this.form.get('params') as FormArray).clear();

                        formGroups.forEach(group => {
                            (this.form.get('params') as FormArray).push(group);
                        });

                        this.paramsArray = (this.form.get('params') as FormArray).controls;
                    },
                    error: (err: any) => {
                        console.error(error, err);
                        this._snackBar(false, 'Error al cargar los detalles del ensayo');
                    }
                });
            },
            error: (err: any) => {
                console.error(error, err);
                this._snackBar(false, 'Error al cargar la información del ensayo');
            }
        });
    }

    private _parseDate(dateStr: string): Date {
        if (!dateStr) return new Date();

        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(+parts[2], +parts[1] - 1, +parts[0]);
        }
        return new Date();
    }

    private _get(): void {
        const error: string = 'abm-assays => assays.component.ts => _get() =>';
        this.configTestService.getId(this.machineId).subscribe({
            next: (res: any) => {
                this.assay = res.data;
                const formGroups = [];
                for (const param of this.assay.parametros) {
                    const group = this.fb.group({
                        nombre: [param.maquinaPrueba.nombre],
                        minimo: [param.minimo],
                        maximo: [param.maximo],
                        resultado: [
                            '',
                            [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)],
                        ],
                        redondeo: [
                            '',
                            [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)],
                        ],
                    });
                    group.get('resultado').valueChanges.subscribe((value) => {
                        group.get('redondeo').setValue(value, { emitEvent: false });
                    });
                    formGroups.push(group);
                }
                this.form.setControl('params', this.fb.array(formGroups));
                this.paramsArray = (this.form.get('params') as FormArray).controls;
            },
            error: (err: any) => console.error(error, err),
        });
    }

    private _post(assay: IAssayCreate): void {
        const error: string = 'abm-lots => lots.component.ts => _post() =>';
        this.assayService.post(assay).subscribe({
            next: () => {
                this._snackBar(true);
                this.dialogRef.close(true);
            },
            error: (err: any) => {
                console.log(error, err);
                this._snackBar(false);
            },
        });
    }

    private _dialogUpdate(ensayoDTO: any): void {
        const dialogRef = this.dialog.open(AssayDialogComponent, {
            width: 'fit-content',
            data: { isUpdate: true }
        });

        dialogRef
            .afterClosed()
            .subscribe((result: { status: string; observation: string }) => {
                if (result) {
                    ensayoDTO.estado = result.status;
                    ensayoDTO.observaciones = result.observation;
                    this._updateAssay(ensayoDTO);
                }
            });
    }

    private _updateAssay(ensayoDTO: any): void {
        const error: string = 'abm-lots => lots.component.ts => _update() =>';

        this.assayService.update(ensayoDTO).subscribe({
            next: () => {
                this._snackBar(true);
                this.dialogRef.close(true);
            },
            error: (err: any) => {
                console.log(error, err);
                this._snackBar(false);
            },
        });
    }

    close(): void {
        if (this.form && this.form.dirty) {
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

    private _snackBar(option?: boolean, test?: string): void {
        let message: string = option
            ? 'Cambios realizados correctamente.'
            : 'No se han podido realizar los cambios.';

        const css: string = option ? 'green' : 'red';

        if (test) {
            message = 'Datos inválidos en la prueba: ' + test;
        }

        this.snackBar.open(message, 'X', {
            duration: 5000,
            panelClass: `${css}-snackbar`,
        });
    }

    private _reset(): void {
        if (this.mode === 'create' || this.mode === 'edit') {
            this.form.reset();
            (this.form.get('params') as FormArray).clear();
        }
        this.dialogRef.close();
    }

    private _range(value: number, min: number, max: number): boolean {
        return (min === null || value >= min) && (max === null || value <= max);
    }

    private _dialog(assay: IAssayCreate): void {
        const dialogRef = this.dialog.open(AssayDialogComponent, {
            width: 'fit-content',
        });

        dialogRef
            .afterClosed()
            .subscribe((result: { status: string; observation: string }) => {
                if (result) {
                    assay.estado = result.status;
                    assay.observaciones = result.observation;
                    this._post(assay);
                }
            });
    }

    private openSaveConfirmation(callback: () => void): void {
        callback();
    }

    private openUpdateConfirmation(callback: () => void): void {
        const dialogRef = this.dialog.open(AssayDialogAlertComponent, {
            width: '400px',
            data: {
                type: 'edit',
                machine: this.machineName
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                callback();
            }
        });
    }
}