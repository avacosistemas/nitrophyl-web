import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import {
    LotePorMaquinaResponse,
    LoteConResultadosCombinadosExtend,
    ResultadoEnsayo
} from 'app/shared/models/lote-por-maquina-reporte.model';
import { MaquinaPrueba } from 'app/shared/models/maquina-prueba.model';
import { MachinesService } from 'app/shared/services/machines.service';
import { Observable, Subscription } from 'rxjs';
import { tap, switchMap, startWith, map, filter } from 'rxjs/operators';
import { IMachine } from 'app/shared/models/machine.model';
import { DatePipe } from '@angular/common';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MachineService } from 'app/shared/services/machine.service';
import { Router } from '@angular/router';
import {
    IFormula,
    IFormulaResponse,
    IFormulasResponse,
} from 'app/shared/models/formula.interface';
import { FormulasService } from 'app/shared/services/formulas.service';
import { ExportDataComponent } from 'app/modules/prompts/export-data/export-data.component';

@Component({
    selector: 'app-ver-informes',
    templateUrl: './ver-informes.component.html',
    styleUrls: ['./ver-informes.component.scss'],
})
export class VerInformesComponent implements OnInit, OnDestroy {
    @ViewChild(ExportDataComponent) exportDataComponent: ExportDataComponent;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    lotes: LoteConResultadosCombinadosExtend[] = [];
    totalRegistros: number = 0;
    pruebas: MaquinaPrueba[] = [];
    cabecerasDinamicas: string[] = [];
    panelOpenState = false;

    form: FormGroup;
    filteredFormulas: Observable<IFormula[]>;
    formulas: IFormula[] = [];

    pageSize: number = 50;
    pageIndex: number = 0;

    ordenColumna: string = '';
    ordenAscendente: boolean = true;
    cargaCompleta: boolean = false;
    exporting: boolean = false;
    displayedColumns: string[] = [
        '#',
        'Fecha',
        'Formula',
        'Lote',
        'Estado',
    ];
    mostrarColumnaObservaciones: boolean = false;

    private unsubscribe$ = new Subscription();

    constructor(
        private machinesService: MachinesService,
        private formulasService: FormulasService,
        private fb: FormBuilder,
        private datePipe: DatePipe,
        public machineService: MachineService,
        private router: Router,
    ) { }


    ngOnInit(): void {
        this.form = this.fb.group({
            fechaDesde: [null],
            fechaHasta: [null],
            idFormula: [null, [this.createFormulaValidator()]],
            nroLote: [''],
            estadoEnsayo: [''],
        });

        this.formulasService.get().pipe(
            map((res: IFormulasResponse | IFormulaResponse) => Array.isArray(res.data) ? res.data : [res.data]),
            tap((formulas: IFormula[]) => this.formulas = formulas)
        ).subscribe(
            () => {
                this.filteredFormulas = this.form.get('idFormula').valueChanges.pipe(
                    startWith(''),
                    map((value: string | IFormula) => {
                        const nombre = typeof value === 'string' ? value : (value?.nombre || '');
                        return nombre ? this._filterFormulas(nombre) : this.formulas.slice();
                    })
                );
            }
        );

        this.unsubscribe$.add(
            this.machineService.selectedMachine$
                .pipe(
                    filter(machine => !!machine),
                )
                .subscribe((maquina) => {
                    if (this.router.url.includes('/resultados/maquina')) {
                        this.cargaCompleta = false;
                        this.cargarDatos(maquina);
                    }
                })
        );

        const initialMachine = this.machineService.getSelectedMachine();
        if (initialMachine) {
            this.cargaCompleta = false;
            this.cargarDatos(initialMachine);
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.unsubscribe();
    }

    cargarDatos(maquina: IMachine): void {
        const idMaquinaSeleccionada = maquina?.id;

        if (!idMaquinaSeleccionada) {
            this.lotes = [];
            this.totalRegistros = 0;
            this.pruebas = [];
            this.machineService.setSubtitle('');
            this.displayedColumns = ['#', 'Fecha', 'Formula', 'Lote', 'Estado'];
            return;
        }

        const fechaDesde = this.form.get('fechaDesde').value
            ? this.datePipe.transform(this.form.get('fechaDesde').value, 'dd/MM/yyyy')
            : null;
        const fechaHasta = this.form.get('fechaHasta').value
            ? this.datePipe.transform(this.form.get('fechaHasta').value, 'dd/MM/yyyy')
            : null;

        const params = {
            first: this.pageIndex * this.pageSize + 1,
            rows: this.pageSize,
            idMaquina: idMaquinaSeleccionada,
            fechaDesde: fechaDesde,
            fechaHasta: fechaHasta,
            idFormula: null,
            nroLote: this.form.get('nroLote').value,
            estadoEnsayo: this.form.get('estadoEnsayo').value,
            idx: this.ordenColumna,
            asc: this.ordenAscendente,
        };

        const formulaSeleccionada = this.form.get('idFormula').value;
        if (formulaSeleccionada && typeof formulaSeleccionada === 'object' && formulaSeleccionada.id) {
            params.idFormula = formulaSeleccionada.id;
        }

        this.machinesService
            .getPruebasPorMaquina(idMaquinaSeleccionada)
            .pipe(
                tap((pruebasResponse) => {
                    if (pruebasResponse && pruebasResponse.data) {
                        this.pruebas = pruebasResponse.data;
                        this.pruebas.sort((a, b) => a.posicion - b.posicion);

                        this.displayedColumns = ['#', 'Fecha', 'Formula', 'Lote', 'Estado',];
                        this.pruebas.forEach(prueba => {
                            this.displayedColumns.push(prueba.nombre + 'Resultado');
                            this.displayedColumns.push(prueba.nombre + 'Redondeo');
                        });
                    } else {
                        this.pruebas = [];
                        this.displayedColumns = ['#', 'Fecha', 'Formula', 'Lote', 'Estado'];
                    }
                }),
                switchMap(() => this.machinesService.getLotesPorMaquina(params))
            )
            .subscribe(
                (lotesResponse: LotePorMaquinaResponse) => {
                    if (lotesResponse && lotesResponse.data) {
                        const lotesProcesados = lotesResponse.data.page.map(lote => {
                            return {
                                ...lote,
                                resultadosCombinados: this.mapearResultadosCombinados(lote.resultados),
                                resultadoGeneral: this.calcularResultadoGeneral(lote.resultados),
                                redondeoGeneral: this.calcularRedondeoGeneral(lote.resultados)
                            }
                        });

                        this.lotes = lotesProcesados;
                        this.totalRegistros = lotesResponse.data.totalReg;

                        this.mostrarColumnaObservaciones = this.lotes.some(lote => lote.observaciones);

                        this.displayedColumns = ['#', 'Fecha', 'Formula', 'Lote', 'Estado',];
                        if (this.mostrarColumnaObservaciones) {
                            this.displayedColumns.push('Observaciones');
                        }
                        this.pruebas.forEach(prueba => {
                            this.displayedColumns.push(prueba.nombre + 'Resultado');
                            this.displayedColumns.push(prueba.nombre + 'Redondeo');
                        });

                        if (this.totalRegistros > 0) {
                            this.machineService.setSubtitle(`Total: ${this.totalRegistros}`);
                        } else {
                            this.machineService.setSubtitle('');
                        }
                    } else {
                        this.lotes = [];
                        this.totalRegistros = 0;
                        this.machineService.setSubtitle('');
                        this.mostrarColumnaObservaciones = false;
                        this.displayedColumns = ['#', 'Fecha', 'Formula', 'Lote', 'Estado'];
                    }
                    this.cargaCompleta = true;
                },
                (error) => {
                    console.error('Error al cargar los datos:', error);
                    this.cargaCompleta = true;
                }
            );
    }

    mapearResultadosCombinados(resultados: ResultadoEnsayo[]): any[] {
        return this.pruebas.map(prueba => {
            const resultadoEnsayo = resultados.find(r => r.idMaquinaPrueba === prueba.id);
            let resultado = null;
            let redondeo = null;

            if (resultadoEnsayo) {
                resultado = this.formatDecimal(resultadoEnsayo.resultado);
                redondeo = this.formatDecimal(resultadoEnsayo.redondeo);

                if (resultado === redondeo) {
                    redondeo = null;
                }
            }

            return {
                [prueba.nombre + 'Resultado']: resultado,
                [prueba.nombre + 'Redondeo']: redondeo
            };

        });
    }


    limpiarControl(controlName: string): void {
        const control = this.form.get(controlName);
        if (control) {
            if (controlName === 'estadoEnsayo') {
                control.setValue('');
            } else {
                control.setValue(null);
            }
        }
    }

    buscar(): void {
        if (this.form.valid) {
            this.cargarDatos(this.machineService.getSelectedMachine());
        } else {
            this.form.markAllAsTouched();
        }
    }

    limpiarFiltros(): void {
        this.form.reset({
            fechaDesde: null,
            fechaHasta: null,
            nombreFormula: '',
            nroLote: '',
            estadoEnsayo: '',
        });

        this.limpiarControl('nombreFormula');
        this.limpiarControl('nroLote');
        this.limpiarControl('estadoEnsayo');
        this.limpiarControl('fechaDesde');
        this.limpiarControl('fechaHasta');

        this.cargarDatos(this.machineService.getSelectedMachine());
    }

    calcularResultadoGeneral(resultados: ResultadoEnsayo[]): string | null {
        if (!resultados || resultados.length === 0) {
            return null;
        }

        return this.formatDecimal(resultados[0].resultado);
    }

    calcularRedondeoGeneral(resultados: ResultadoEnsayo[]): string | null {
        if (!resultados || resultados.length === 0) {
            return null;
        }

        const resultado = this.formatDecimal(resultados[0].resultado);
        const redondeo = this.formatDecimal(resultados[0].redondeo);

        return resultado === redondeo ? null : redondeo;
    }

    formatDecimal(value: number | string | null): string {
        if (value === null || value === undefined) {
            return '';
        }

        const num = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(num)) {
            return '';
        }

        return num.toFixed(2).replace('.', ',');
    }

    pageChanged(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.cargarDatos(this.machineService.getSelectedMachine());
    }

    ordenar(columna: string, asc: boolean): void {
        switch (columna) {
            case 'Fecha':
                this.ordenColumna = 'lo.fecha';
                break;
            case 'Formula':
                this.ordenColumna = 'f.nombre';
                break;
            case 'Lote':
                this.ordenColumna = 'lo.nro_lote';
                break;
            default:
                this.ordenColumna = '';
                this.ordenAscendente = true;
                return;
        }

        this.ordenAscendente = asc;
        this.cargarDatos(this.machineService.getSelectedMachine());
    }

    obtenerValorResultado(element: any, columna: string): any {
        if (columna === 'Resultado') {
            return element.resultadoGeneral || '';
        }
        if (columna === 'Redondeo') {
            return element.redondeoGeneral || '';
        }

        for (const resultado of element.resultadosCombinados) {
            if (resultado.hasOwnProperty(columna)) {
                return resultado[columna];
            }
        }
        return '';
    }

    onEnter(event: KeyboardEvent): void {
        event.preventDefault();
        this.buscar();
    }

    onGetAllData(event: { tipo: string; scope: string }): void {
        if (event.scope === 'pagina') {
            this.exportarPaginaActual(event.tipo);
        } else if (event.scope === 'todo') {
            this.cargarTodosLosDatosParaExportar(event.tipo, event.tipo);
        }
    }

    exportarPaginaActual(tipo: string): void {
        const formattedData = this.formatDataForExport(this.lotes, tipo);
        this.procesarExportacion(tipo, formattedData);
    }

    cargarTodosLosDatosParaExportar(tipo: string, tipoExport: string): void {
        const maquina = this.machineService.getSelectedMachine();
        if (!maquina) {
            console.warn('No hay máquina seleccionada para exportar.');
            return;
        }

        const idMaquinaSeleccionada = maquina.id;

        const params = {
            first: 1,
            rows: 999999,
            idMaquina: idMaquinaSeleccionada,
            nroLote: '',
            estadoEnsayo: '',
            idx: '',
            asc: true
        };

        this.exporting = true;

        this.machinesService.getLotesPorMaquina(params)
            .pipe(
                map((lotesResponse: LotePorMaquinaResponse) => {
                    if (lotesResponse && lotesResponse.data) {
                        return lotesResponse.data.page.map(lote => ({
                            ...lote,
                            resultadosCombinados: this.mapearResultadosCombinados(lote.resultados),
                            resultadoGeneral: this.calcularResultadoGeneral(lote.resultados),
                            redondeoGeneral: this.calcularRedondeoGeneral(lote.resultados)
                        }));
                    } else {
                        return [];
                    }
                }),
            )
            .subscribe(
                (lotes: any[]) => {
                    const formattedData = this.formatDataForExport(lotes, tipoExport);
                    this.procesarExportacion(tipoExport, formattedData);
                    this.exporting = false;
                },
                (error) => {
                    console.error('Error al cargar los datos para la exportación:', error);
                    this.exporting = false;
                }
            );
    }

    procesarExportacion(tipo: string, data: any[]): void {
        switch (tipo) {
            case 'csv':
                this.exportDataComponent.descargarCsv(data);
                break;
            case 'excel':
                this.exportDataComponent.descargarExcel(data);
                break;
            case 'pdf':
                this.exportDataComponent.descargarPdf(data);
                break;
            default:
                console.warn('Tipo de exportación no soportado:', tipo);
        }
    }

    formatDataForExport(data: any[], tipo: string): any[] {
        return data.map(item => {
            const formattedItem: any = {
                'Fecha': item.fecha,
                'Formula': item.nombreFormula,
                'Lote': item.nroLote,
                'Observaciones': item.observaciones,
                'Estado': item.estadoEnsayo,
            };

            this.pruebas.forEach(prueba => {
                const resultado = item.resultados.find(r => r.idMaquinaPrueba === prueba.id);
                let resultadoValue = '';
                let redondeoValue = '';

                if (resultado) {
                    resultadoValue = this.formatDecimalExport(resultado.resultado, tipo);
                    redondeoValue = this.formatDecimalExport(resultado.redondeo, tipo);
                }

                formattedItem[`${prueba.nombre} Resultado`] = tipo === 'excel' ? resultadoValue : resultadoValue;
                formattedItem[`${prueba.nombre} Redondeo`] = tipo === 'excel' && redondeoValue !== '' ? redondeoValue : redondeoValue;
            });

            return formattedItem;
        });
    }

    getValorPrueba(item: any, prueba: MaquinaPrueba, tipo: string): any {
        const resultadoObj = item.resultadosCombinados.find((obj: any) => obj.hasOwnProperty(`${prueba.nombre} ${tipo === 'resultado' ? 'Resultado' : 'Redondeo'}`));
        return resultadoObj ? resultadoObj[`${prueba.nombre} ${tipo === 'resultado' ? 'Resultado' : 'Redondeo'}`] : '';
    }

    formatDecimalExport(value: string | number | null, tipo: string): string {
        if (value === null || value === undefined) {
            return '';
        }

        const num = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(num)) {
            return '';
        }

        let formatted = num.toFixed(2).replace('.', ',');

        return formatted;
    }

    public displayFormulaFn(formula: IFormula | null): string {
        return formula?.nombre || '';
    }

    private _filterFormulas(value: string): IFormula[] {
        const filterValue = value.toLowerCase();
        return this.formulas.filter(formula => formula.nombre.toLowerCase().includes(filterValue));
    }

    private createFormulaValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            if (!value) {
                return null;
            }
            if (typeof value === 'string') {
                return { invalidFormula: true };
            }
            if (value === 0) {
                return null;
            }
            if (value?.id) {
                return null;
            }
            return { invalidFormula: true };
        };
    }
}