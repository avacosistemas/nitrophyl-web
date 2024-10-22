import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  forkJoin,
  merge,
  of,
  Subscription,
} from 'rxjs';

// * Services.
import { FormulasService } from 'app/shared/services/formulas.service';
import { MaterialsService } from 'app/shared/services/materials.service';
import { TestService } from 'app/shared/services/test.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';
import { MachinesService } from 'app/shared/services/machines.service';

// * Interfaces.
import {
  IFormula,
  IFormulaResponse,
  IConfiguracionPruebaParametro,
  ITestFormula
} from 'app/shared/models/formula.interface';
import {
  IMaterial,
  IMaterialsResponse,
} from 'app/shared/models/material.interface';

// * Forms.
import {
  FormBuilder,
  FormControl,
  FormGroup,
  PatternValidator,
  Validators,
} from '@angular/forms';

// * Materials.
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-formula',
  templateUrl: './formula.component.html',
})
export class FormulaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawer') drawer: MatDrawer;

  // * mode: Edit.
  public mode: string;
  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IMaterial[] | undefined;

  // * mode: Test.
  public drawerOpened: boolean = false;
  public selectedIndex: number = 0;
  public machine: string = '';
  public formTest: FormGroup;
  public formTestMachine: FormGroup;
  public rpdto: any;

  public revision$: any;
  public machines$: any;
  public machinesForm$: any[] = [];
  public displayedColumnsMachines: string[] = ['name', 'vigente', 'fecha', 'fechaHasta', 'revision'];

  public params$: any[] = [];
  public displayedColumnsParams: string[] = ['name', 'min', 'max', 'norma'];

  public conditions$: string[] = [];
  public displayedColumnsConditions: string[] = [];
  public mostrarResultadosReporte: boolean;
  public component: string = 'Mode';

  private suscripcion: Subscription;
  private formula$: IFormula;
  private id: number;
  private idMachine: number;

  constructor(
    private _materials: MaterialsService,
    private _formulas: FormulasService,
    private _testService: TestService,
    private _configTest: ConfigTestService,
    private _machines: MachinesService,
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    if (!this._formulas.getMode()) {
      this.router.navigate(['/formulas/grid']);
    }

    this.mode = this._formulas.getMode();

    if (
      this.mode === 'Edit' ||
      this.mode === 'Create' ||
      this.mode === 'Test'
    ) {
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
      if (this.mode === 'Edit' || this.mode === 'Create') {
        this.setForm();
      }
      if (this.mode === 'Test') {
        this.setFormMachine();
        this.formTest = this.formBuilder.group({
          condition: null,
          observacionesReporte : null
        });
      }
    }

    this.subscription();
  }

  public ngOnInit(): void {
    switch (this.mode) {
      case 'Create':
        this.getMaterials();
        break;
      case 'View':
        this.getFormula();
        break;
      case 'Edit':
        this.loadData();
        break;
      case 'Test':
        this.getRevision();
        this.getMachines();
        this.getMachinesForm();
        break;
      default:
        break;
    }
  }

  public changeDrawer(option: boolean): void {
    if (option) {
      this.drawer.open();
      this._formulas.work(true);
    } else if (this.formTest.enabled) {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: 'formulas', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) {
          this.drawer.close();
          this._formulas.work(false);
        }
      });
    } else {
      this.drawer.close();
      this._formulas.work(false);
    }
  }

  public saveTest(): void {
    const body: ITestFormula = {
      idFormula: this.id,
      idMaquina: this.idMachine,
      parametros: [],
      condiciones: [],
      observacionesReporte: null,
      mostrarResultadosReporte: false
    };
    const controls = this.formTest.controls;
    for (const param of this.params$) {
      const minvparam = controls[param.id + '.min'].value;
      const maxvparam = controls[param.id + '.max'].value;
      if (!minvparam && !maxvparam && !Number(minvparam) && !Number(maxvparam)) {
        this.openSnackBar(false, `El parametro '${param.nombre}' debe contener al menos un valor asignado.`);
        return;
      }

      const minvparamnum = Number(minvparam);
      const maxvparamnum = Number(maxvparam);

      if (
        minvparam !== null && minvparam.trim().length > 0 &&
        maxvparam !== null && maxvparam.trim().length > 0 &&
        minvparamnum > maxvparamnum
      ) {
        this.openSnackBar(false, `El valor mínimo del parametro '${param.nombre}' no puede ser mayor al valor máximo.`);
        return;
      } else {
        body.parametros.push({
          id: null,
          maquinaPrueba: {id: param.id, nombre: param.nombre},
          minimo: minvparam,
          maximo: maxvparam,
          norma: controls[param.id + '.norma'].value
        });
      }
    }

    for (const condition of this.conditions$) {
      body.condiciones.push({
        nombre: condition,
        valor: controls[condition + '.value'].value,
      });
    }

    body.observacionesReporte = controls['observacionesReporte'].value;
    body.mostrarResultadosReporte = this.mostrarResultadosReporte;

    this.postMachine(body);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.suscripcion.unsubscribe();
    }
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  public close(): void {
    if (this.mode === 'Test') {
      this.router.navigate(['/formulas/grid']);
      return;
    }
    if (this.form.pristine === true) {
      this.router.navigate(['/formulas/grid']);
    } else {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: 'formulas', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) {
          this.router.navigate(['/formulas/grid']);
        }
      });
    }
  }

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.mode === 'Create') {
      this.postFormula();
    }
    if (this.mode === 'Edit') {
      this.putFormula();
    }
  }

  public getTest(id: number): void {
    const error: string = 'formula.component.ts => getTest() => ';
    this._configTest.get(id).subscribe({
      next: (res: any) => {
        this.displayedColumnsConditions = ['condition', 'value'];
        this.formTest = this.formBuilder.group({});
        this.formTest = this.formBuilder.group({
          condition: null,
          observacionesReporte: null
        });
        this.setValues(res.data.parametros,
                      res.data.condiciones,
                      res.data.observacionesReporte,
                      res.data.mostrarResultadosReporte);
        this.formTest.disable();
        this.machine = res.data.maquina;
        this.selectedIndex = 0;
        this.changeDrawer(true);
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  public deleteCondition(row: any): void {
    this.formTest.removeControl(row);
    this.conditions$ = this.conditions$.filter((x: any) => x !== row);
  }

  public addCondition(): void {
    const condition: string | undefined =
      this.formTest.controls.condition.value;

    if (!condition || this.conditions$.includes(condition)) {
      return;
    }

    this.formTest.addControl(`${condition}.value`, new FormControl(null));
    this.conditions$.push(condition);
    this.conditions$ = [...this.conditions$];
    this.formTest.controls.condition.setValue(null);
  }

  public addMachineForm(): void {
    if (this.formTestMachine.invalid) {return;}
    const machine: any = this.formTestMachine.controls.machine;
    this._formulas.events.next([4, machine.value.id, machine.value.nombre]);
    machine.reset();
  }

  generarNuevaRevision(): void {
    this._formulas.marcarRevision(this.id).subscribe({
      next: (response) => {
        console.log('Revisión marcada con éxito:', response);
        this.getRevision();
      },
      error: (error) => {
        console.error('Error al marcar la revisión:', error);
      },
    });
  }

  public mostrarRevision(rpdto: any): void {
    this.rpdto = rpdto;
  }

  private getRevision(): void {
    const error: string = 'FormulaComponent => getRevision(): ';
    this._formulas.get({ id: this.id }).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.revision$ = formula.data;
          this.mostrarRevision(this.revision$.rpdto);
        }
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private getMachinesForm(): void {
    this.formTestMachine.controls.machine.reset();
    const error: string = 'formula.component.ts => getMachines() => ';
    this._machines.get().subscribe({
      next: (res: any) => {
        this.machinesForm$ = [...res.data];
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private postMachine(body: ITestFormula): void {
    const error: string = 'formula.component.ts => postTest() => ';
    this._configTest.post(body).subscribe({
      next: () => {
        this.getMachines();
        this.drawer.close();
        this._formulas.work(false);
        this.openSnackBar(true);
      },
      error: (err: any) => {
        console.error(error, err);
        this.openSnackBar(false);
      },
      complete: () => {},
    });
  }

  private getMachines(): void {
    const error: string = 'formula.component.ts => getMachines() => ';
    this._configTest.getMachines(this.id).subscribe({
      next: (res: any) => {
        this.machines$ = [...res.data];
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private setValues(
    params: IConfiguracionPruebaParametro[],
    conditions: [{ id: number; nombre: string; valor: number }],
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
      this.params$.push({id: param.maquinaPrueba.id, nombre: param.maquinaPrueba.nombre, min: param.minimo, max: param.maximo, norma: param.norma});
    }
    this.params$ = [...this.params$];

    this.conditions$ = [];
    for (const condition of conditions) {
      this.formTest.addControl(
        `${condition.nombre}.value`,
        new FormControl(condition.valor)
      );
      this.conditions$.push(condition.nombre);
    }
    this.conditions$ = [...this.conditions$];

    this.formTest.controls['observacionesReporte'].setValue(observacionesReporte);
    this.mostrarResultadosReporte = mostrarResultadosReporte;
  }

  private addMachine(id: number): void {
    const error: string = 'formula.component.ts => getMachines() => ';
    this._testService.getTest(id).subscribe({
      next: (res: any) => {
        this.formTest.enable();
        this.formTest = this.formBuilder.group({});
        this.formTest = this.formBuilder.group({
          condition: null,
          observacionesReporte: null
        });
        this.displayedColumnsConditions = ['condition', 'value', 'actions'];
        this.params$ = [];
        this.conditions$ = [];

        for (const param of res.data) {
          this.params$.push(param);
          this.formTest.addControl(`${param.id}.min`, new FormControl(null));
          this.formTest.addControl(`${param.id}.max`, new FormControl(null));
          this.formTest.addControl(`${param.id}.norma`, new FormControl(null));
          this.configureValidators(param.id);
        }

        this.params$ = [...this.params$];
        this.selectedIndex = 0;

        this.changeDrawer(true);
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
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

  private loadData(): void {
    const error: string = 'FormulaComponent. ngOnInit => loadData: ';
    forkJoin([
      this._materials.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.getMaterials() ', err);
          this.materialsFail = true;
          return of([]);
        })
      ),
      this._formulas.get({ id: this.id }).pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.getFormulas() ', err);
          return of([]);
        })
      ),
    ]).subscribe({
      next: ([materials, formula]: [IMaterialsResponse, IFormulaResponse]) => {
        this.form.controls.version.setValue(formula.data.version);
        this.form.controls.date.setValue(formula.data.fecha);
        this.form.controls.name.setValue(formula.data.nombre);
        this.form.controls.norma.setValue(formula.data.norma);
        this.form.controls.observaciones.setValue(formula.data.observaciones);
        this.formula$ = formula.data;
        if (this.materialsFail) {
          this.materials$ = [
            {
              id: this.formula$.idMaterial,
              nombre: this.formula$.material,
            },
          ];
          this.form.controls.material.disable();
        } else {
          this.materials$ = materials.data;
        }
        this.materials$ = [...this.materials$];
        this.form.controls.material.setValue(formula.data.idMaterial);
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private getMaterials(): void {
    const error: string = 'FormulaComponent => getMaterials(): ';
    this._materials.get().subscribe({
      next: (res: IMaterialsResponse) => (this.materials$ = res.data),
      error: (err) => {
        this.form.controls.material.disable();
        this.materialsFail = true;
        console.error(error, err);
      },
      complete: () => {},
    });
  }

  private getFormula(): void {
    const error: string = 'FormulaComponent => getFormula(): ';
    this._formulas.get({ id: this.id }).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.form.controls.version.setValue(formula.data.version);
          this.form.controls.date.setValue(formula.data.fecha);
          this.form.controls.name.setValue(formula.data.nombre);
          this.form.controls.material.setValue(formula.data.material);
          this.form.controls.observaciones.setValue(formula.data.observaciones);
        }
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private postFormula(): void {
    const error: string = 'FormulaComponent => postFormula(): ';
    const body: IFormula = {
      nombre: this.form.controls.name.value,
      idMaterial: this.form.controls.material.value,
      norma: this.form.controls.norma.value,
      observaciones: this.form.controls.observaciones.value,
    };
    this._formulas.post(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.openSnackBar(true);
          // this._formulas.setMode('Edit');
          // this.router.navigate([`/formulas/edit/${formula.data.id}`]);
          this.router.navigate(['/formulas/grid']);
        }
      },
      error: (err) => {
        this.openSnackBar(false);
        console.error(error, err);
      },
      complete: () => {},
    });
  }

  private putFormula(): void {
    const error: string = 'FormulaComponent => putFormula(): ';
    const body: IFormula = {
      id: this.formula$.id,
      nombre: this.form.controls.name.value,
      idMaterial: this.form.controls.material.value,
      material: this.formula$.material,
      norma: this.form.controls.norma.value,
      observaciones: this.form.controls.observaciones.value,
    };
    this._formulas.put(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.openSnackBar(true);
          this._formulas.setMode('Edit');
          this.router.navigate(['/formulas/grid']);
        }
      },
      error: (err) => {
        this.openSnackBar(false);
        console.error(error, err);
      },
      complete: () => {},
    });
  }

  private setFormMachine(): void {
    this.formTestMachine = this.formBuilder.group({
      machine: [null, Validators.required],
    });
  }

  private setForm(): void {
    this.form = this.formBuilder.group({
      version: [{ value: null, disabled: this.mode === 'Edit' }],
      date: [{ value: null, disabled: this.mode === 'Edit' }],
      name: [
        { value: null, disabled: this.mode === 'Edit' },
        Validators.compose([
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(100),
        ]),
      ],
      material: [
        { value: null, disabled: this.mode === 'Edit' },
        Validators.required,
      ],
      norma: [
        {value: null, disabled: this.mode === 'Edit'},
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
      observaciones: [null, Validators.maxLength(255)],
    });
  }

  private subscription(): void {
    this.suscripcion = this._formulas.events.subscribe((data: any) => {
      if (data === 1) {
        this.close();
      }
      if (data === 3) {
        this.create();
      }
      if (data[0] === 4) {
        this.idMachine = data[1];
        this.addMachine(data[1]);
        this.machine = data[2];
      }
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
