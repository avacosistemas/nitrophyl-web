import { AfterViewInit, Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
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
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChildren('campoInput') inputs!: QueryList<ElementRef>;

  public formulas$: Observable<IFormula[]>;
  public component: string = 'all';
  public machines$: IMachine[] | undefined;
  public machinesFail: boolean = false;
  public materialsFail: boolean = false;
  public materials$: IConfiguracion[] | undefined;
  public clientes$: Cliente[] | undefined;
  public clientesFail: boolean = false;
  public filteredMachines$: Observable<IMachine[]>;
  public filteredClientes$: Observable<Cliente[]>;

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
  pageSize = 10;
  public pageIndex = 0;
  searching: boolean;

  dataSource = new MatTableDataSource<IConfiguracion>([]);

  private formulasBackUp$: IFormula[] = [];

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

  ngOnInit(): void {
    // Cargar fórmulas
    this.formulaService.get().pipe(
      map((res: IFormulasResponse | IFormulaResponse) =>
        Array.isArray(res.data) ? res.data : [res.data]
      )
    ).subscribe((formulas: IFormula[]) => {
      this.formulas = formulas;
      this.formulasBackUp$ = formulas;
      this.formulas$ = this.form.controls['formula'].valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nombre),
        map(name => name ? this._filterFormulas(name) : this.formulas.slice())
      );
    });
    this.machinesService.get().pipe(
      catchError((err: any) => {
        console.error('Error fetching machines', err);
        this.machinesFail = true;
        return of([]);
      })
    ).subscribe((machinesResponse: IMachineResponse) => {
      this.machines$ = machinesResponse.data;
      this.filteredMachines$ = this.form.controls['machine'].valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nombre),
        map(name => name ? this._filterMachines(name) : this.machines$ || [])
      );
    });
    this.clientesService.getClientes().pipe(
      catchError((err: any) => {
        console.error('Error fetching clientes', err);
        this.clientesFail = true;
        return of({ data: [] } as ResponseClientes);
      })
    ).subscribe((clientesResponse: ResponseClientes) => {
      this.clientes$ = clientesResponse.data;
      this.filteredClientes$ = this.form.controls['cliente'].valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nombre),
        map(name => name ? this._filterClientes(name) : this.clientes$ || [])
      );
    });
    this.loadData();
  }

  limpiar(): void {
    this.form.reset();
    this.loadData();
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

  public displayFormulaFn(formula: IFormula): string {
    if (typeof formula === 'number' && formula === 0) {return 'Todos';}
    return formula ? `${formula.nombre} V${formula.version} (${formula.norma})` : '';
  }

  public displayMachineFn(machine: IMachine): string {
    if (typeof machine === 'number' && machine === 0) {return 'Todos';}
    return machine && machine.nombre ? machine.nombre : '';
  }

  public displayClienteFn(cliente?: Cliente): string {
    if (typeof cliente === 'number' && cliente === 0) {return 'Todos';}
    return cliente && cliente.nombre ? cliente.nombre : '';
  }

  limpiarCampo(campo: string): void {
    this.form.controls[campo].setValue(null);
    this.form.controls[campo].markAsPristine();
    this.form.controls[campo].markAsUntouched();

    const input = this.inputs.find(
      el => el.nativeElement.getAttribute('formControlName') === campo
    );

    if (input) {
      setTimeout(() => input.nativeElement.blur(), 0);
    }
  }

  public version(name: string): number {
    const filteredFormulas = this.formulasBackUp$.filter(
      (formula: any) => formula.nombre === name
    );
    if (filteredFormulas.length > 0)
      {return Math.max(...filteredFormulas.map(formula => formula.version));}

    return 0;
  }

  onSortChange(sort: MatSort): void {
    this.updateDataSource();
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

  delete(row): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '40%',
      data: { data: row.name, seccion: 'configuracion', boton: 'Eliminar' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.configuracionService.delete(row.id).subscribe((response) => {
          if (response.status === 'OK') {
            this.showSuccess = true;
          } else {
            this.showError = true;
          }
          this.loadData();
        });
      }
    });
  }

  public search(): void {
    this.pageIndex = 0;
    this.getPagedData();
  }

  public pageChangeEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updateDataSource();
  }

  public getPagedData(): void {
    const formValues = this.form.getRawValue();
    const body: IConfiguracion = {
      idCliente: formValues.cliente ? formValues.cliente.id : null,
      idFormula: formValues.formula ? formValues.formula.id : null,
      idMaquina: formValues.machine ? formValues.machine.id : null,
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

  private updateDataSource(): void {
    if (!this.configuracionesBackup$) { return; }

    const modifiedData = this.configuracionesBackup$.map(configuracion => ({
      ...configuracion,
      cliente: configuracion.cliente ? configuracion.cliente : 'Todos',
      maquina: configuracion.maquina ? configuracion.maquina : 'Todos',
    }));

    const sortedData = this.sortData(modifiedData, this.sort);
    this.dataSource.data = sortedData;
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

  private loadData(): void {
    const error: string = 'ConfiguracionesComponent => loadData: ';
    forkJoin([
      this.clientesService.getClientes().pipe(
        catchError((err: any) => {
          console.error('Error fetching clientes', err);
          this.clientesFail = true;
          this.form.controls.material.disable();
          return of({ data: [] } as ResponseClientes);
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
          return of({ data: [] } as IMachineResponse);
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

  private _filterFormulas(name: string): IFormula[] {
    return this.formulas.filter(formula =>
      formula.nombre.toLowerCase().includes(name.toLowerCase())
    );
  }

  private _filterMachines(name: string): IMachine[] {
    return this.machines$?.filter(machine =>
      machine.nombre.toLowerCase().includes(name.toLowerCase())
    ) || [];
  }

  private _filterClientes(name: string): Cliente[] {
    return this.clientes$?.filter(cliente =>
      cliente.nombre.toLowerCase().includes(name.toLowerCase())
    ) || [];
  }
}
