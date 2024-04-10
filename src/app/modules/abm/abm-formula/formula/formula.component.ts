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
import { MachinesService } from 'app/shared/services/machines.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';

// * Interfaces.
import {
  IFormula,
  IFormulaResponse,
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

export interface ITest {
  idFormula: number;
  idMaquina: number;
  parametros: IParams[];
  condiciones: IConditions[];
  observacionesReporte: string;
  mostrarResultadosReporte: boolean;
}

export interface IParams {
  nombre: string;
  maximo: number | null;
  minimo: number | null;
  norma: string | null;
}

export interface IConditions {
  nombre: string;
  valor: number;
}

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
  public drawerOpened: boolean = false; // fuse-drawer [opened].
  public selectedIndex: number = 0;
  public machine: string = ''; // Título.
  public formTest: FormGroup; // Formulario de pruebas.

  public machines$: any; // Maquinas asociadas a la formula.
  public displayedColumnsMachines: string[] = ['name'];

  public params$: string[] = []; // Parametros asociados a una maquina.
  public displayedColumnsParams: string[] = ['name', 'min', 'max', 'norma'];

  public conditions$: string[] = []; // Condiciones asociadas a una maquina.
  public displayedColumnsConditions: string[] = [];

  public component: string = 'Mode';

  private suscripcion: Subscription;
  private formula$: IFormula;
  private id: number;
  private idMachine: number; // ID Maquina.

  public mostrarResultadosReporte: boolean;

  constructor(
    private _materials: MaterialsService,
    private _formulas: FormulasService,
    private _machines: MachinesService,
    private _configTest: ConfigTestService,
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
        this.getMachines();
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
    const body: ITest = {
      idFormula: this.id,
      idMaquina: this.idMachine,
      parametros: [],
      condiciones: [],
      observacionesReporte: null,
      mostrarResultadosReporte: false
    };
    const controls = this.formTest.controls;
    for (const param of this.params$) {
      var minvparam = controls[param + '.min'].value;
      var maxvparam = controls[param + '.max'].value
      if (!minvparam && !maxvparam && !Number(minvparam) && !Number(maxvparam)) {
        this.snackBar.open(
          `El parametro '${param}' debe contener al menos un valor asignado.`,
          'X',
          {
            duration: 5000,
            panelClass: 'red-snackbar',
          }
        );
        return;
      } 
      
      var minvparamnum = Number(minvparam);
      var maxvparamnum = Number(maxvparam);

      if (
        minvparam !== null && minvparam.trim().length > 0 &&
        maxvparam !== null && maxvparam.trim().length > 0 &&
        minvparamnum > maxvparamnum
      ) {
        this.snackBar.open(
          `El valor mínimo del parametro '${param}' no puede ser mayor al valor máximo.`,
          'X',
          {
            duration: 5000,
            panelClass: 'red-snackbar',
          }
        );
        return;
      } else {
        body.parametros.push({
          nombre: param,
          minimo: minvparam,
          maximo: maxvparam,
          norma: controls[param + '.norma'].value
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

  private postMachine(body: ITest): void {
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
    params: [{ id: number; nombre: string; minimo: number; maximo: number, norma: string }],
    conditions: [{ id: number; nombre: string; valor: number }],
    observacionesReporte: string,
    mostrarResultadosReporte : boolean
  ): void {
    this.params$ = [];
    for (const param of params) {
      this.formTest.addControl(
        `${param.nombre}.min`,
        new FormControl(param.minimo)
      );
      this.formTest.addControl(
        `${param.nombre}.max`,
        new FormControl(param.maximo)
      );
      this.formTest.addControl(
        `${param.nombre}.norma`,
        new FormControl(param.norma)
      );
      this.params$.push(param.nombre);
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
    this._machines.getTest(id).subscribe({
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
          this.formTest.addControl(`${param}.min`, new FormControl(null));
          this.formTest.addControl(`${param}.max`, new FormControl(null));
          this.formTest.addControl(`${param}.norma`, new FormControl(null));
          this.configureValidators(param);
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
