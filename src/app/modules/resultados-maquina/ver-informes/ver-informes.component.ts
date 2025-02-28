import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import {
    LotePorMaquinaResponse,
    LoteConResultadosCombinados,
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

    lotes: LoteConResultadosCombinados[] = [];
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
            this.cabecerasDinamicas = [];
            this.machineService.setSubtitle('');
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
                        this.cabecerasDinamicas = [
                            '#',
                            'Fecha',
                            'Formula',
                            'Lote',
                            'Observaciones',
                            'Estado',
                        ];
                        this.cabecerasDinamicas.push(
                            ...this.pruebas.map(prueba => prueba.nombre)
                        );
                    }
                }),
                switchMap(() => this.machinesService.getLotesPorMaquina(params))
            )
            .subscribe(
                (lotesResponse: LotePorMaquinaResponse) => {
                    if (lotesResponse && lotesResponse.data) {
                        const lotesProcesados = lotesResponse.data.page.map(lote => ({
                            ...lote,
                            resultadosCombinados: [],
                        }));

                        this.lotes = lotesProcesados;
                        this.combinarResultados(this.lotes);

                        this.totalRegistros = lotesResponse.data.totalReg;
                        if (this.totalRegistros > 0) {
                            this.machineService.setSubtitle(`Total: ${this.totalRegistros}`);
                        } else {
                            this.machineService.setSubtitle('');
                        }


                    } else {
                        this.lotes = [];
                        this.totalRegistros = 0;
                        this.machineService.setSubtitle('');
                    }
                    this.cargaCompleta = true;
                },
                (error) => {
                    console.error('Error al cargar los datos:', error);
                    this.cargaCompleta = true;
                }
            );
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

    combinarResultados(lotes: LoteConResultadosCombinados[]): void {
        lotes.forEach((lote) => {
            lote.resultadosCombinados = this.pruebas.map((prueba) => {
                const resultado = lote.resultados.find(
                    r => r.idMaquinaPrueba === prueba.id
                );
                return resultado
                    ? { valor: resultado.resultado, id: resultado.idMaquinaPrueba }
                    : { valor: null, id: prueba.id };
            });
            delete lote.resultados;
        });
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

    obtenerValorResultado(lote: LoteConResultadosCombinados, nombrePrueba: string): any {
        const resultadoCombinado = lote.resultadosCombinados.find((resultado) => {
            const prueba = this.pruebas.find(p => p.id === resultado.id);
            return prueba?.nombre === nombrePrueba;
        });

        return resultadoCombinado?.valor !== undefined && resultadoCombinado?.valor !== null
            ? resultadoCombinado.valor
            : '';
    }

    onEnter(event: KeyboardEvent): void {
        event.preventDefault();
        this.buscar();
    }


    onGetAllData(event: { tipo: string; scope: string }): void {
        if (event.scope === 'pagina') {
            this.exportarPaginaActual(event.tipo);
        } else if (event.scope === 'todo') {
            this.cargarTodosLosDatosParaExportar(event.tipo);
        }
    }

    exportarPaginaActual(tipo: string): void {
        const formattedData = this.formatDataForExport(this.lotes);
        this.procesarExportacion(tipo, formattedData);
    }

    cargarTodosLosDatosParaExportar(tipo: string): void {
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
                            resultadosCombinados: [],
                        }));
                    } else {
                        return [];
                    }
                }),
                tap(lotes => this.combinarResultados(lotes))
            )
            .subscribe(
                (lotes: LoteConResultadosCombinados[]) => {
                    const formattedData = this.formatDataForExport(lotes);
                    this.procesarExportacion(tipo, formattedData);
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

    formatDataForExport(data: any[]): any[] {
        return data.map(item => {
            const formattedItem: any = {
                'Fecha': item.fecha,
                'Formula': item.nombreFormula,
                'Lote': item.nroLote,
                'Observaciones': item.observaciones,
                'Estado': item.estadoEnsayo
            };

            this.pruebas.forEach(prueba => {
                const resultado = item.resultadosCombinados.find((r: { id: number }) => r.id === prueba.id);
                formattedItem[prueba.nombre] = resultado ? resultado.valor : '';
            });

            return formattedItem;
        });
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