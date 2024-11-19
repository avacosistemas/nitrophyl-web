import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { Cliente, ResponseClientes } from 'app/shared/models/cliente.model';
import { IConfiguracion, IConfiguracionResponse } from 'app/shared/models/configuracion.interface';
import { IFormula, IFormulaResponse, IFormulasResponse } from 'app/shared/models/formula.interface';
import { IMachine, IMachineResponse } from 'app/shared/models/machine.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { FormulasService } from 'app/shared/services/formulas.service';
import { ConfiguracionService } from 'app/shared/services/configuracion.service';
import { MachinesService } from 'app/shared/services/machines.service';
import { TestService } from 'app/shared/services/test.service';
import { ITest } from 'app/shared/models/test.model';
import { catchError, forkJoin, map, Observable, of, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: []
})
export class ConfiguracionComponent implements OnInit {
  @ViewChildren('campoInput') inputs!: QueryList<ElementRef>;

  suscripcion: Subscription;
  public mode: string;
  public form: FormGroup;
  public formulas$: Observable<IFormula[]>;
  public component: string = 'Mode';
  public machines$: IMachine[] | undefined;
  public machinesFail: boolean = false;
  public clientes$: Cliente[] | undefined;
  public clientesFail: boolean = false;
  public filteredMachines$: Observable<IMachine[]>;
  public filteredClientes$: Observable<Cliente[]>;
  public tests: ITest[] = [];
  public selectedMachineName: string | null = null;

  public configuraciones$: IConfiguracion[] | undefined;
  public formulas: IFormula[];

  public formTest: FormGroup;
  private configuracion$: IConfiguracion;
  private id: number;
  private formulasBackUp$: IFormula[] = [];


  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configuracionService: ConfiguracionService,
    private formulaService: FormulasService,
    private activeRoute: ActivatedRoute,
    private machinesService: MachinesService,
    private clientesService: ClientesService,
    private formBuilder: FormBuilder,
    private router: Router,
    private testService: TestService
  ) {
    if (!this.configuracionService.getMode()) {
      this.router.navigate(['/configuracion/grid']);
      return;
    }

    this.mode = this.configuracionService.getMode();

    if (
      this.mode === 'Edit' ||
      this.mode === 'Create' ||
      this.mode === 'View' ||
      this.mode === 'Test'
    ) {
      this.activeRoute.paramMap.subscribe((param: any) => {
        this.id = +param.get('id');
      });
      if (this.mode === 'Edit' || this.mode === 'Create' || this.mode === 'View') {
        this.setupForm();
      }
      if (this.mode === 'Test') {
        this.formTest = this.formBuilder.group({
          condition: null,
          observacionesReporte: null
        });
      }
      this.subscription();
    }
  }

  get hasSelectedTests(): boolean {
    return this.tests.some(test => test.selected);
  }

  ngOnInit(): void {
    this.mode = this.configuracionService.getMode();
    this.setupForm();
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

    switch (this.mode) {
      case 'Create':
        break;
      case 'View':
        this.loadData();
        break;
      case 'Edit':
        this.loadData();
        break;
      case 'Test':
        break;
      default:
        break;
    }
  }

  onMachineSelectionChange(machineId: number | { id: number; nombre: string } | null): void {
    if (!machineId) {
      this.tests = [];
      this.selectedMachineName = null;
      return;
    } else if (typeof machineId === 'object' && machineId.id) {
      this.selectedMachineName = machineId.nombre;
      this.testService.getTest(machineId.id).subscribe((response) => {
        this.tests = response.data.map((test: ITest) => ({
          ...test,
          selected: false
        }));
      });
    }
  }

  selectAllTests(): void {
    if (this.tests) {
      this.tests.forEach(test => test.selected = true);
    }
  }

  deselectAllTests(): void {
    if (this.tests) {
      this.tests.forEach(test => test.selected = false);
    }
  }

  public version(name: string): number {
    const filteredFormulas = this.formulasBackUp$.filter(
      (formula: any) => formula.nombre === name
    );
    if (filteredFormulas.length > 0) { return Math.max(...filteredFormulas.map(formula => formula.version)); }

    return 0;
  }

  public displayFormulaFn(formula: IFormula): string {
    if (typeof formula === 'number' && formula === 0) { return 'Todos'; }
    return formula ? `${formula.nombre} V${formula.version} (${formula.norma})` : '';
  }

  public displayMachineFn(machine: IMachine): string {
    if (typeof machine === 'number' && machine === 0) { return 'Todos'; }
    return machine && machine.nombre ? machine.nombre : '';
  }

  public displayClienteFn(cliente?: Cliente): string {
    if (typeof cliente === 'number' && cliente === 0) { return 'Todos'; }
    return cliente && cliente.nombre ? cliente.nombre : '';
  }

  limpiarCampo(campo: string): void {
    this.form.controls[campo].setValue(null);
    this.form.controls[campo].markAsPristine();
    this.form.controls[campo].markAsUntouched();
    this.tests = [];

    const input = this.inputs.find(
      el => el.nativeElement.getAttribute('formControlName') === campo
    );

    if (input) {
      setTimeout(() => input.nativeElement.blur(), 0);
    }
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      formula: new FormControl(null),
      cliente: new FormControl(null),
      machine: new FormControl(null),
      mostrarParametros: new FormControl(false),
      mostrarObservacionesParametro: new FormControl({ value: false, disabled: true }),
      mostrarResultados: new FormControl({ value: false, disabled: true }),
      mostrarCondiciones: new FormControl({ value: false, disabled: true })
    });

    this.onChanges();
  }

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.mode === 'Create') {
      this.postConfiguracion();
    } else if (this.mode === 'Edit') {
      this.putConfiguracion();
    }
  }

  onChanges(): void {
    this.form.get('mostrarParametros').valueChanges.subscribe((value) => {
      if (value) {
        this.form.get('mostrarObservacionesParametro').enable();
        this.form.get('mostrarResultados').enable();
      } else {
        this.form.get('mostrarObservacionesParametro').disable();
        this.form.get('mostrarResultados').disable();
        this.form.get('mostrarCondiciones').disable();
      }
    });

    this.form.get('mostrarResultados').valueChanges.subscribe((value) => {
      if (value) {
        this.form.get('mostrarCondiciones').enable();
      } else {
        this.form.get('mostrarCondiciones').disable();
      }
    });
  }

  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngOnDestroy(): void {
    if (this.suscripcion) {
      this.suscripcion.unsubscribe();
    }
  }

  public close(): void {
    if (this.mode === 'Test') {
      this.router.navigate(['/configuracion/grid']);
      return;
    }
    if (this.form.pristine === true) {
      this.router.navigate(['/configuracion/grid']);
    } else {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: 'formulas', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) {
          this.router.navigate(['/configuracion/grid']);
        }
      });
    }
  }

  private postConfiguracion(): void {
    const error: string = 'ConfiguracionComponent => postConfiguracion(): ';
    const formValues = this.form.getRawValue();
    const selectedTests = this.tests
      .filter(test => test.selected)
      .map(test => test.id);

    const body: IConfiguracion = {
      idCliente: formValues.cliente.id,
      idFormula: formValues.formula.id,
      idMaquina: formValues.machine.id,
      mostrarParametros: formValues.mostrarParametros,
      mostrarObservacionesParametro: formValues.mostrarParametros ? formValues.mostrarObservacionesParametro : false,
      mostrarResultados: formValues.mostrarParametros ? formValues.mostrarResultados : false,
      mostrarCondiciones: (formValues.mostrarParametros && formValues.mostrarResultados) ? formValues.mostrarCondiciones : false,
      idsPruebas: selectedTests,
    };

    this.configuracionService.post(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.openSnackBar(true);
          this.router.navigate(['/configuracion/grid']);
        }
      },
      error: (err) => {
        this.openSnackBar(false);
        console.error(error, err);
      },
      complete: () => { },
    });
  }

  private putConfiguracion(): void {
    const error: string = 'ConfiguracionComponent => putConfiguracion(): ';
    const formValues = this.form.getRawValue();
    const selectedTests = this.tests
      .filter(test => test.selected)
      .map(test => test.id);

    const body: IConfiguracion = {
      id: this.configuracion$.id,
      idCliente: formValues.cliente.id,
      idFormula: formValues.formula.id,
      idMaquina: formValues.machine.id,
      mostrarParametros: formValues.mostrarParametros,
      mostrarObservacionesParametro: formValues.mostrarParametros ? formValues.mostrarObservacionesParametro : false,
      mostrarResultados: formValues.mostrarParametros ? formValues.mostrarResultados : false,
      mostrarCondiciones: (formValues.mostrarParametros && formValues.mostrarResultados) ? formValues.mostrarCondiciones : false,
      idsPruebas: selectedTests,
    };

    this.configuracionService.put(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.openSnackBar(true);
          this.configuracionService.setMode('Edit');
          this.router.navigate(['/configuracion/grid']);
        }
      },
      error: (err) => {
        this.openSnackBar(false);
        console.error(error, err);
      },
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

  private loadData(): void {
    const error: string = 'ConfiguracionComponent => loadData: ';

    forkJoin([
      this.configuracionService.get({ id: this.id }).pipe(
        catchError((err: any) => {
          console.error(error, 'Error en configuración', err);
          return of(null);
        })
      ),
    ]).subscribe(([configuraciones]: any) => {
      const configuracion = Array.isArray(configuraciones?.data?.page)
        ? configuraciones.data.page.find(t => t.id === this.id)
        : configuraciones?.data;

      if (configuracion) {
        const clienteSeleccionado = this.clientes$.find(f => f.id === configuracion.idCliente);
        this.form.controls.cliente.setValue(clienteSeleccionado);

        const formulaSeleccionada = this.formulas.find(f => f.id === configuracion.idFormula);
        this.form.controls.formula.setValue(formulaSeleccionada);

        const maquinaSeleccionada = this.machines$.find(f => f.id === configuracion.idMaquina);
        this.form.controls.machine.setValue(maquinaSeleccionada);

        this.selectedMachineName = maquinaSeleccionada?.nombre;

        this.form.controls.mostrarCondiciones.setValue(configuracion.mostrarCondiciones);
        this.form.controls.mostrarObservacionesParametro.setValue(configuracion.mostrarObservacionesParametro);
        this.form.controls.mostrarResultados.setValue(configuracion.mostrarResultados);
        this.form.controls.mostrarParametros.setValue(configuracion.mostrarParametros);

        this.configuracion$ = configuracion;

        if (this.mode !== 'View') {
          this.testService.getTest(configuracion.idMaquina).subscribe((response) => {
            this.tests = response.data.map((test: ITest) => ({
              ...test,
              selected: configuracion.idsPruebas.includes(test.id)
            }));
          });
        } else {
          this.testService.getTest(configuracion.idMaquina).subscribe((response) => {
            this.tests = response.data.map((test: ITest) => ({
              ...test,
              selected: configuracion.idsPruebas.includes(test.id),
              disabled: true
            }));
            this.form.disable();
          });
        }
      } else {
        this.openSnackBar(false, 'Configuración no encontrada.');
        this.router.navigate(['/configuracion/grid']);
      }
    });
  }

  private subscription(): void {
    this.suscripcion = this.configuracionService.events.subscribe((data: any) => {
      if (data === 1) {
        this.close();
      }
      if (data === 3) {
        this.create();
      }
    });
  }
}
