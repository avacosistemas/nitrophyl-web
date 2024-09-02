import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, startWith } from 'rxjs';

// * Services.
import { FormulasService } from 'app/shared/services/formulas.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// * Interfaces.
import {
  IFormula,
  IFormulaResponse,
  IFormulasResponse,
} from 'app/shared/models/formula.interface';

// * Forms.
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IConfiguracion, IConfiguracionesData, IConfiguracionesResponse, IConfiguracionResponse } from 'app/shared/models/configuracion.interface';
import { MachinesService } from 'app/shared/services/machines.service';
import { IMachine, IMachineResponse, IResponse } from 'app/shared/models/machine.model';
import { Cliente, ResponseClientes } from 'app/shared/models/cliente.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { ConfiguracionService } from 'app/shared/services/configuracion.service';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.component.html',
})
export class ConfiguracionesComponent implements OnInit, AfterViewInit {
  private formulasBackUp$: IFormula[] = [];
  public formulas$: Observable<IFormula[]>;
  public component: string = 'all';
  public machines$: IMachine[] | undefined;
  public machinesFail: boolean = false;
  public materialsFail: boolean = false;
  public materials$: IConfiguracion[] | undefined;

  public clientes$: Cliente[] | undefined;
  public clientesFail: boolean = false;

  public configuracionesBackup$: IConfiguracion[] | undefined;
  public configuraciones: Observable<IConfiguracion[]>;
  public displayedColumns: string[] = [
    'cliente',
    'formula',
    'maquina',
    'mostrarCondiciones',
    'mostrarResultados',
    'mostrarObservacionesParametro',
    'mostrarParametros',
    'actions',
  ];
  public mostrarParametros: boolean = false;
  public mostrarResultados: boolean = false;
  public mostrarCondiciones: boolean = false;
  public mostrarObservaciones: boolean = false;

  public showSuccess: boolean = false;
  public showError: boolean = false;
  public panelOpenState: boolean = false;
  public form: FormGroup;

  public formulas: IFormula[];

  totalRecords = 0;
  pageSize = 5;
  public pageIndex = 0;
  searching: boolean;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource<IConfiguracion>([]);
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;

  constructor(
    private formulaService: FormulasService,
    private machinesService: MachinesService,
    private dialog: MatDialog,
    private clientesService: ClientesService,
    private configuracionService: ConfiguracionService,
    private formBuilder: FormBuilder
  ) {

    this.form = this.formBuilder.group({
      formula: new FormControl(null),
      cliente: new FormControl(null),
      machine: new FormControl(null),
      mostrarParametros: new FormControl(false),
      mostrarObservaciones: new FormControl(false),
      mostrarResultados: new FormControl(false),
      mostrarCondiciones: new FormControl(false)
    });
  }

  public ngOnInit(): void {
    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
        this.formulasBackUp$ = formulas;
        this.formulas$ = this.form.controls['formula'].valueChanges.pipe(
          startWith(''),
          map((value: IFormula) =>
            typeof value === 'string' ? value : value?.nombre
          ),
          map((name: string) =>
            name ? this._filter(name) : this.formulas.slice()
          )
        );
      });
    this.loadData();
  }

  private _filter(name: string): IFormula[] {
    return this.formulas.filter(
      (formula: IFormula) =>
        formula.nombre.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }

    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }

  public version(name: string): number {
    const filteredFormulas = this.formulasBackUp$.filter(
      (formula: any) => formula.nombre === name
    );
    if (filteredFormulas.length > 0)
      return Math.max(...filteredFormulas.map((formula) => formula.version));

    return 0;
  }

  onSortChange(sort: MatSort): void {
    this.updateDataSource();
  }

  private loadData(): void {
    let error: string = 'ConfiguracionesComponent => loadData: ';
    forkJoin([
      this.clientesService.getClientes().pipe(
        catchError((err: any) => {
          console.error('Error fetching clientes', err);
          this.clientesFail = true;
          this.form.controls.material.disable();
          return of({ data: [] } as ResponseClientes); // Devuelve un objeto compatible con el tipo esperado
        })
      ),
      this.configuracionService.get().pipe(
        map((res: IConfiguracionesResponse) => Array.isArray(res.data) ? res.data : [res.data]),
        catchError((err: any) => {
          console.error('Error fetching configuraciones', err);
          return of([] as IConfiguracion[]);
        })
      ),
      this.machinesService.get().pipe(
        catchError((err: any) => {
          console.error('Error fetching machines', err);
          this.machinesFail = true;
          return of({ data: [] } as IMachineResponse); // Devuelve un objeto compatible con el tipo esperado
        })
      )
    ]).subscribe({
      next: ([clientes, configuraciones, machines]: [ResponseClientes, IConfiguracion[], IMachineResponse]) => {
        this.clientes$ = clientes.data;
        this.configuracionesBackup$ = configuraciones;
        this.machines$ = machines.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => { },
    });

    this.getPagedData();
  }

  public mode(option: number, row: any): void {
    switch (option) {
      case 1:
        this.configuracionService.setMode('Edit');
        break;
      case 2:
        this.configuracionService.setMode('View');
        break;
      case 3:
        this.configuracionService.setMode('Test');
        break;
      default:
        break;
    }
  }

  delete(row) {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '40%',
      data: { data: row.name, seccion: "configuracion", boton: "Eliminar" },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.configuracionService.delete(row.id).subscribe(response => {
          if (response.status == 'OK') {
            this.showSuccess = true;
          } else {
            this.showError = true;
          }
          this.loadData();
        })
      }
    });
  }

  public search(): void {
    this.pageIndex = 0;
    this.getPagedData();
  }

  private updateDataSource(): void {
    if (!this.configuracionesBackup$) return;
    const sortedData = this.sortData(this.configuracionesBackup$, this.sort);
    this.dataSource.data = sortedData; // Actualizamos el dataSource con datos ordenados
    
      //this.updatePagedData();
  }

  private updatePagedData(): void {
    if (this.paginator && this.dataSource) {
      const paginatedData = this.paginateData(this.dataSource.data);
      this.dataSource.data = paginatedData;
    }
  }
  
  private paginateData(data: IConfiguracion[]): IConfiguracion[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return data.slice(startIndex, endIndex);
  }

  public pageChangeEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updateDataSource();
  }

  public getPagedData(): void {
    const formValues = this.form.getRawValue();
    const body: IConfiguracion = {
      idCliente: formValues.cliente,
      idFormula: formValues.formula?.id,
      idMaquina: formValues.machine?.id,
      mostrarParametros: formValues.mostrarParametros,
      mostrarObservacionesParametro: formValues.mostrarObservaciones,
      mostrarResultados: formValues.mostrarResultados,
      mostrarCondiciones: formValues.mostrarCondiciones,
    };

    this.configuracionService.get(body)
      .pipe(map((res: IConfiguracionesResponse) => res.data))
      .subscribe((response: IConfiguracionesData) => {
        this.configuracionesBackup$ = response.page;
        this.totalRecords = response.totalReg;
        this.updateDataSource();
      });
  }

  private sortData(data: IConfiguracion[], sort: MatSort): IConfiguracion[] {
    if (!sort.active || sort.direction === '') {
      return data;
    }
  
    const isAsc = sort.direction === 'asc';
    return data.sort((a, b) => {
      switch (sort.active) {
        case 'cliente': return this.compare(a.cliente, b.cliente, isAsc);
        case 'formula': return this.compare(a.formula, b.formula, isAsc);
        case 'maquina': return this.compare(a.maquina, b.maquina, isAsc);
        case 'mostrarCondiciones': return this.compare(a.mostrarCondiciones, b.mostrarCondiciones, isAsc);
        case 'mostrarResultados': return this.compare(a.mostrarResultados, b.mostrarResultados, isAsc);
        case 'mostrarObservacionesParametro': return this.compare(a.mostrarObservacionesParametro, b.mostrarObservacionesParametro, isAsc);
        case 'mostrarParametros': return this.compare(a.mostrarParametros, b.mostrarParametros, isAsc);
        default: return 0;
      }
    });
  }

  private compare(a: any, b: any, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
