import { Component, OnInit } from '@angular/core';
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
import { catchError, forkJoin, map, Observable, of, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: []
})
export class ConfiguracionComponent implements OnInit {

  suscripcion: Subscription;
  public mode: string;
  public form: FormGroup;
  public formulas$: Observable<IFormula[]>;
  public component: string = 'Mode';
  public machines$: IMachine[] | undefined;
  public machinesFail: boolean = false;

  private id: number;
  public clientes$: Cliente[] | undefined;
  public clientesFail: boolean = false;

  public configuraciones$: IConfiguracion[] | undefined;
  public formulas: IFormula[];
  private configuracion$: IConfiguracion;
  public formTest: FormGroup; // Formulario de pruebas.

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
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
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

  ngOnInit(): void {
    this.mode = this.configuracionService.getMode();
    this.setupForm();
    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
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

    switch (this.mode) {
      case 'Create':
        this.loadData();
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

  setupForm() {
    this.form = this.formBuilder.group({
      formula: new FormControl(""),
      cliente: new FormControl(null),
      machine: new FormControl(null),
      mostrarParametros: new FormControl(false),
      mostrarObservacionesParametro: new FormControl({ value: false, disabled: true }),
      mostrarResultados: new FormControl({ value: false, disabled: true }),
      mostrarCondiciones: new FormControl({ value: false, disabled: true })
    });

    this.onChanges();
  }

  private loadData(): void {
    let error: string = 'ConfiguracionComponent => loadData: ';
    forkJoin([
      this.clientesService.getClientes().pipe(
        catchError((err: any) => {
          console.error(error, 'this.clientesService.get() ', err);
          this.clientesFail = true;
          return of([]);
        })
      ),
      this.configuracionService.get({ id: this.id }).pipe(
        catchError((err: any) => {
          console.error(error, 'this.configuracionService.get() ', err);
          return of([]);
        })
      ),
      this.machinesService.get().pipe(
        catchError((err: any) => {
          this.machinesFail = true;
          console.error(error, 'this.machinesService.get() ', err);
          return of([]);
        })
      )
    ]).subscribe({
      next: ([clientes, configuraciones, machines]: [
        ResponseClientes,
        any,
        IMachineResponse
      ]) => {
        this.clientes$ = clientes.data;
        this.machines$ = machines.data;

        if (configuraciones) {
          var configuracion = configuraciones.data.page.find(t => t.id == this.id);
          this.form.controls.cliente.setValue(configuracion.idCliente);

          const formulaSeleccionada = this.formulas.find(f => f.id === configuracion.idFormula);
          this.form.controls.formula.setValue(formulaSeleccionada); // Establecer el objeto completo de la fórmula

          const maquinaSeleccionada = this.machines$.find(f => f.id === configuracion.idMaquina);
          this.form.controls.machine.setValue(maquinaSeleccionada);

          this.form.controls.mostrarCondiciones.setValue(configuracion.mostrarCondiciones);
          this.form.controls.mostrarObservacionesParametro.setValue(configuracion.mostrarObservacionesParametro);
          this.form.controls.mostrarResultados.setValue(configuracion.mostrarResultados);
          this.form.controls.mostrarParametros.setValue(configuracion.mostrarParametros);
          this.configuracion$ = configuracion;
        }
      },
      error: (err: any) => console.error(error, err),
      complete: () => { },
    });
  }

  onChanges(): void {
    this.form.get('mostrarParametros').valueChanges.subscribe(value => {
      if (value) {
        this.form.get('mostrarObservacionesParametro').enable();
        this.form.get('mostrarResultados').enable();
      } else {
        this.form.get('mostrarObservacionesParametro').disable();
        this.form.get('mostrarResultados').disable();
        this.form.get('mostrarCondiciones').disable();
      }
    });

    this.form.get('mostrarResultados').valueChanges.subscribe(value => {
      if (value) {
        this.form.get('mostrarCondiciones').enable();
      } else {
        this.form.get('mostrarCondiciones').disable();
      }
    });
  }

  private _filter(name: string): IFormula[] {
    return this.formulas.filter(
      (formula: IFormula) =>
        formula.nombre.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }

  ngOnDestroy(): void {
    if (this.suscripcion) {
      this.suscripcion.unsubscribe();
    }
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

    const body: IConfiguracion = {
      idCliente: formValues.cliente,
      idFormula: formValues.formula.id,
      idMaquina: formValues.machine.id,
      mostrarParametros: formValues.mostrarParametros,
      mostrarObservacionesParametro: formValues.mostrarParametros ? formValues.mostrarObservacionesParametro : false,
      mostrarResultados: formValues.mostrarParametros ? formValues.mostrarResultados : false,
      mostrarCondiciones: (formValues.mostrarParametros && formValues.mostrarResultados) ? formValues.mostrarCondiciones : false
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

    const body: IConfiguracion = {
      id: this.configuracion$.id,
      idCliente: formValues.cliente,
      idFormula: formValues.formula.id,
      idMaquina: formValues.machine.id,
      mostrarParametros: formValues.mostrarParametros,
      mostrarObservacionesParametro: formValues.mostrarParametros ? formValues.mostrarObservacionesParametro : false,
      mostrarResultados: formValues.mostrarParametros ? formValues.mostrarResultados : false,
      mostrarCondiciones: (formValues.mostrarParametros && formValues.mostrarResultados) ? formValues.mostrarCondiciones : false
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

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.mode === 'Create') {
      this.postConfiguracion();
    }
    if (this.mode === 'Edit') {
      this.putConfiguracion();
    }
  }

  private openSnackBar(option: boolean): void {
    const message: string = option
      ? 'Cambios realizados.'
      : 'No se pudieron realizar los cambios.';
    const css: string = option ? 'green' : 'red';
    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }
}
