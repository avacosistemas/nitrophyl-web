
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  LotePorMaquinaResponse,
  LoteConResultadosCombinados,
} from 'app/shared/models/lote-por-maquina-reporte.model';
import { MaquinaPrueba } from 'app/shared/models/maquina-prueba.model';
import { MachinesService } from 'app/shared/services/machines.service';
import { Observable, Subscription } from 'rxjs';
import { tap, switchMap, debounceTime, startWith, map, filter } from 'rxjs/operators';
import { IMachine } from 'app/shared/models/machine.model';
import { DatePipe } from '@angular/common';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MachineService } from 'app/shared/services/machine.service';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-ver-informes',
  templateUrl: './ver-informes.component.html',
  styleUrls: ['./ver-informes.component.scss'],
})
export class VerInformesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  lotes: LoteConResultadosCombinados[] = [];
  totalRegistros: number = 0;
  pruebas: MaquinaPrueba[] = [];
  cabecerasDinamicas: string[] = [];
  panelOpenState = false;

  form: FormGroup;
  filteredFormulas: Observable<string[]>;

  pageSize: number = 50;
  pageIndex: number = 0;

  ordenColumna: string = '';
  ordenAscendente: boolean = true;

  private unsubscribe$ = new Subscription();

  constructor(
    private machinesService: MachinesService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    public machineService: MachineService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      fechaDesde: [null],
      fechaHasta: [null],
      nombreFormula: [''],
      nroLote: [''],
      estadoLote: [''],
    });

    this.filteredFormulas = this.form.get('nombreFormula').valueChanges.pipe(
      startWith(''),
      map(value => this._filterFormulas(value))
    );

    this.unsubscribe$.add(
      this.machineService.selectedMachine$
        .pipe(
          filter(machine => !!machine),
          debounceTime(300)
        )
        .subscribe((maquina) => {

          if (this.router.url.includes('/resultados/maquina')) {
            this.cargarDatos(maquina);
          }
        })
    );

    this.unsubscribe$.add(
      this.form.valueChanges
        .pipe(debounceTime(400))
        .subscribe(() => {

          this.cargarDatos(this.machineService.getSelectedMachine());
        })
    );

    this.unsubscribe$.add(
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          tap(() => {
            if (this.router.url.includes('/reports/resultados')) {
              this.cargarDatos(this.machineService.getSelectedMachine());
            }
          })
        )
        .subscribe()
    );

    const initialMachine = this.machineService.getSelectedMachine();
    if (initialMachine) {
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
      estadoLote: this.form.get('estadoLote').value,
      idx: this.ordenColumna,
      asc: this.ordenAscendente,
    };

    if (this.form.get('nombreFormula').value) {
      const formulaSeleccionada = this.lotes.find(
        lote => lote.nombreFormula === this.form.get('nombreFormula').value
      );
      params.idFormula = formulaSeleccionada ? formulaSeleccionada.idFormula : null;
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
            this.lotes = lotesResponse.data.page.map(lote => ({
              ...lote,
              resultadosCombinados: [],
            }));
            this.totalRegistros = lotesResponse.data.totalReg;
            if (this.totalRegistros > 0) {
              this.machineService.setSubtitle(`Total: ${this.totalRegistros}`);
            } else {
              this.machineService.setSubtitle('');
            }
            this.combinarResultados();
          } else {

            this.lotes = [];
            this.totalRegistros = 0;
            this.machineService.setSubtitle('');
          }
        },
        (error) => {
          console.error('Error al cargar los datos:', error);
        }
      );
  }

  limpiarControl(controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      if (controlName === 'estadoLote') {
        control.setValue('');
      } else {
        control.setValue(null);
      }
    }
  }

  combinarResultados(): void {
    this.lotes.forEach((lote) => {
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

  private _filterFormulas(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.lotes
      .map(lote => lote.nombreFormula)
      .filter(formula => formula && formula.toLowerCase().includes(filterValue))
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .filter((value, index, self) => self.indexOf(value) === index);
  }
}
