import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
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
    private notificationService: NotificationService,
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

    const sources: { [key: string]: Observable<any> } = {
      formulas: this.formulaService.get().pipe(
        map((res: IFormulasResponse | IFormulaResponse) => Array.isArray(res.data) ? res.data : [res.data]),
        catchError(err => {
          console.error('Error fetching formulas', err);
          return of([]);
        })
      ),
      machines: this.machinesService.get().pipe(
        map(response => response.data),
        catchError(err => {
          console.error('Error fetching machines', err);
          this.machinesFail = true;
          return of([]);
        })
      ),
      clientes: this.clientesService.getClientes().pipe(
        map(response => response.data),
        catchError(err => {
          console.error('Error fetching clientes', err);
          this.clientesFail = true;
          return of([]);
        })
      )
    };

    if (this.mode === 'Edit' || this.mode === 'View') {
      sources.configuracion = this.configuracionService.get({ id: this.id }).pipe(
        map(response => {
          if (response?.data && 'page' in response.data && Array.isArray((response.data as any).page)) {
            return (response.data as any).page.find(t => t.id === this.id);
          }
          return response?.data;
        }),
        catchError(err => {
          console.error('Error fetching configuracion', err);
          this.notificationService.showError('Configuración no encontrada.');
          this.router.navigate(['/configuracion/grid']);
          return of(null);
        })
      );
    }

    forkJoin(sources).subscribe({
      next: (results) => {
        this.formulas = results.formulas;
        this.formulasBackUp$ = results.formulas;
        this.machines$ = results.machines;
        this.clientes$ = results.clientes;

        this.formulas$ = this.form.controls['formula'].valueChanges.pipe(
          startWith(''),
          map(value => typeof value === 'string' ? value : value?.nombre),
          map(name => name ? this._filterFormulas(name) : this.formulas.slice())
        );
        this.filteredMachines$ = this.form.controls['machine'].valueChanges.pipe(
          startWith(''),
          map(value => typeof value === 'string' ? value : value?.nombre),
          map(name => name ? this._filterMachines(name) : this.machines$ || [])
        );
        this.filteredClientes$ = this.form.controls['cliente'].valueChanges.pipe(
          startWith(''),
          map(value => this._filterClientes(value))
        );

        const configuracion = results.configuracion;
        if (configuracion) {
          this.configuracion$ = configuracion;

          const clienteSeleccionado = configuracion.idCliente === null ? 0 : this.clientes$.find(f => f.id === configuracion.idCliente);
          const formulaSeleccionada = this.formulas.find(f => f.id === configuracion.idFormula);

          const maquinaSeleccionada: IMachine | number | undefined = configuracion.idMaquina === null
            ? 0
            : this.machines$.find(f => f.id === configuracion.idMaquina);

          this.form.patchValue({
            cliente: clienteSeleccionado,
            formula: formulaSeleccionada,
            machine: maquinaSeleccionada,
            mostrarParametros: configuracion.mostrarParametros,
            mostrarObservacionesParametro: configuracion.mostrarObservacionesParametro,
            mostrarResultados: configuracion.mostrarResultados,
            mostrarCondiciones: configuracion.mostrarCondiciones,
            enviarGrafico: configuracion.enviarGrafico
          });

          this.selectedMachineName = maquinaSeleccionada === 0 ? 'Todos' : (maquinaSeleccionada as IMachine)?.nombre;

          if (maquinaSeleccionada && typeof maquinaSeleccionada === 'object') {
            this.testService.getTest(maquinaSeleccionada.id).subscribe((response) => {
              this.tests = response.data.map((test: ITest) => ({
                ...test,
                selected: configuracion.idsPruebas.includes(test.id),
                disabled: this.mode === 'View'
              }));
            });
          } else {
            this.tests = [];
          }

          if (this.mode === 'View') {
            this.form.disable();
          }

        } else if (this.mode === 'Edit' || this.mode === 'View') {
          this.notificationService.showError('La configuración solicitada no se pudo cargar.');
          this.router.navigate(['/configuracion/grid']);
        }
      },
      error: (err) => {
        console.error("Error crítico en forkJoin al cargar datos iniciales", err);
        this.notificationService.showError('Ocurrió un error al cargar los datos de la página.');
      }
    });
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

  public displayMachineFn(machine: IMachine | number | null): string {
    if (machine === null) { return ''; }
    if (machine === 0) { return 'Todos'; }
    return machine && typeof machine === 'object' && machine.nombre ? machine.nombre : '';
  }

  public displayClienteFn(cliente: Cliente | number | null): string {
    if (cliente === null) { return ''; }
    if (cliente === 0) { return 'Todos'; }
    return cliente && typeof cliente === 'object' && cliente.nombre ? cliente.nombre : '';
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
      mostrarCondiciones: new FormControl({ value: false, disabled: true }),
      enviarGrafico: new FormControl({ value: false, disabled: false }),
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
      enviarGrafico: formValues.enviarGrafico
    };

    this.configuracionService.post(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.notificationService.showSuccess('Cambios realizados.');
          this.router.navigate(['/configuracion/grid']);
        }
      },
      error: (err) => {
        this.notificationService.showError('No se pudieron realizar los cambios.');
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
      enviarGrafico: formValues.enviarGrafico
    };

    this.configuracionService.put(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.notificationService.showSuccess('Cambios realizados.');
          this.configuracionService.setMode('Edit');
          this.router.navigate(['/configuracion/grid']);
        }
      },
      error: (err) => {
        this.notificationService.showError('No se pudieron realizar los cambios.');
        console.error(error, err);
      },
      complete: () => { },
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

  private _filterClientes(value: string | Cliente): Cliente[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    if (!this.clientes$) {
      return [];
    }
    if (!filterValue) {
      return this.clientes$;
    }
    return this.clientes$.filter(cliente =>
      cliente.nombre.toLowerCase().includes(filterValue) ||
      (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
    );
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