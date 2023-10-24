import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, forkJoin, of, Subscription } from 'rxjs';

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
}

export interface IParams {
  nombre: string;
  maximo: number | null;
  minimo: number | null;
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
  private suscripcion: Subscription;
  private formula$: IFormula;
  private id: number;

  // * mode: Edit.
  public mode: string;
  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IMaterial[] | undefined;

  // * mode: Test.
  private idMachine: number; // ID Maquina.
  public drawerOpened: boolean = false; // fuse-drawer [opened].
  public selectedIndex: number = 0;
  public machine: string = ''; // Título.
  public formTest: FormGroup; // Formulario de pruebas.

  public machines$: any; // Maquinas asociadas a la formula.
  public displayedColumnsMachines: string[] = ['name'];

  public params$: string[] = []; // Parametros asociados a una maquina.
  public displayedColumnsParams: string[] = ['name', 'min', 'max'];

  public conditions$: string[] = []; // Condiciones asociadas a una maquina.
  public displayedColumnsConditions: string[] = [];

  @ViewChild('drawer') drawer: MatDrawer;

  public component: string = 'Mode';

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
    if (!this._formulas.getMode()) this.router.navigate(['/formulas/grid']);

    this.mode = this._formulas.getMode();

    if (
      this.mode === 'Edit' ||
      this.mode === 'Create' ||
      this.mode === 'Test'
    ) {
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
      if (this.mode === 'Edit' || this.mode === 'Create') this.setForm();
      if (this.mode === 'Test') {
        this.formTest = this.formBuilder.group({
          condition: null,
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
    let body: ITest = {
      idFormula: this.id,
      idMaquina: this.idMachine,
      parametros: [],
      condiciones: [],
    };
    let controls = this.formTest.controls;
    for (let param of this.params$) {
      if (!controls[param + '.min'].value && !controls[param + '.max'].value) {
        this.snackBar.open(
          `El parametro '${param}' debe contener al menos un valor asignado.`,
          'X',
          {
            duration: 5000,
            panelClass: 'red-snackbar',
          }
        );
        return;
      } else if (
        controls[param + '.min'].value !== null &&
        controls[param + '.max'].value !== null &&
        controls[param + '.min'].value > controls[param + '.max'].value
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
          minimo: controls[param + '.min'].value,
          maximo: controls[param + '.max'].value,
        });
      }
    }

    for (let condition of this.conditions$) {
      body.condiciones.push({
        nombre: condition,
        valor: controls[condition + '.value'].value,
      });
    }

    this.postMachine(body);
  }

  public ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
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
    if (this.form.pristine == true) {
      this.router.navigate(['/formulas/grid']);
    } else {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: 'formulas', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) this.router.navigate(['/formulas/grid']);
      });
    }
  }

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.mode === 'Create') this.postFormula();
    if (this.mode === 'Edit') this.putFormula();
  }

  public getTest(id: number): void {
    let error: string = 'formula.component.ts => getTest() => ';
    this._configTest.get(id).subscribe({
      next: (res: any) => {
        this.displayedColumnsConditions = ['condition', 'value'];
        this.formTest = this.formBuilder.group({});
        this.formTest = this.formBuilder.group({
          condition: null,
        });
        this.setValues(res.data.parametros, res.data.condiciones);
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
    this.conditions$ = this.conditions$.filter((x) => x !== row);
  }

  public addCondition(): void {
    let condition: string | undefined = this.formTest.controls.condition.value;

    if (!condition || this.conditions$.includes(condition)) return;

    this.formTest.addControl(`${condition}.value`, new FormControl(null));
    this.conditions$.push(condition);
    this.conditions$ = [...this.conditions$];
    this.formTest.controls.condition.setValue(null);
  }

  private postMachine(body: ITest): void {
    let error: string = 'formula.component.ts => postTest() => ';
    this._configTest.post(body).subscribe({
      next: () => {
        this.getMachines();
        this.changeDrawer(false);
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
    let error: string = 'formula.component.ts => getMachines() => ';
    this._configTest.getMachines(this.id).subscribe({
      next: (res: any) => {
        this.machines$ = [...res.data];
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private setValues(
    params: [{ id: number; nombre: string; minimo: number; maximo: number }],
    conditions: [{ id: number; nombre: string; valor: number }]
  ): void {
    this.params$ = [];
    for (let param of params) {
      this.formTest.addControl(
        `${param.nombre}.min`,
        new FormControl(param.minimo)
      );
      this.formTest.addControl(
        `${param.nombre}.max`,
        new FormControl(param.maximo)
      );
      this.params$.push(param.nombre);
    }
    this.params$ = [...this.params$];

    this.conditions$ = [];
    for (let condition of conditions) {
      this.formTest.addControl(
        `${condition.nombre}.value`,
        new FormControl(condition.valor)
      );
      this.conditions$.push(condition.nombre);
    }
    this.conditions$ = [...this.conditions$];
  }

  private addMachine(id: number): void {
    let error: string = 'formula.component.ts => getMachines() => ';
    this._machines.getTest(id).subscribe({
      next: (res: any) => {
        this.formTest.enable();
        this.formTest = this.formBuilder.group({});
        this.formTest = this.formBuilder.group({
          condition: null,
        });
        this.displayedColumnsConditions = ['condition', 'value', 'actions'];
        this.params$ = [];
        this.conditions$ = [];

        for (let param of res.data) {
          this.formTest.addControl(`${param}.min`, new FormControl(null));
          this.formTest.addControl(`${param}.max`, new FormControl(null));
          this.params$.push(param);
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
    let controls = this.formTest.controls;
    const pattern: RegExp = /^\d+(\.\d{1,4})?$/;

    controls[param + '.min'].valueChanges.subscribe((value: any) => {
      if (value) {
        if (!pattern.test(value)) {
          controls[param + '.min'].setErrors({ pattern: true });
        } else {
          controls[param + '.min'].setErrors(null);
        }
      }
    });

    controls[param + '.max'].valueChanges.subscribe((value: any) => {
      if (value) {
        if (!pattern.test(value)) {
          controls[param + '.max'].setErrors({ pattern: true });
        } else {
          controls[param + '.max'].setErrors(null);
        }
      }
    });

    combineLatest([
      controls[param + '.min'].valueChanges,
      controls[param + '.max'].valueChanges,
    ]).subscribe(([minValue, maxValue]) => {
      if (minValue && maxValue) {
        if (
          minValue > maxValue ||
          !pattern.test(minValue) ||
          !pattern.test(maxValue)
        ) {
          controls[param + '.max'].setErrors({ max: true });
        } else {
          controls[param + '.max'].setErrors(null);
        }
      }
    });
  }

  private loadData(): void {
    let error: string = 'FormulaComponent. ngOnInit => loadData: ';
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
    let error: string = 'FormulaComponent => getMaterials(): ';
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
    let error: string = 'FormulaComponent => getFormula(): ';
    this._formulas.get({ id: this.id }).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.form.controls.version.setValue(formula.data.version);
          this.form.controls.date.setValue(formula.data.fecha);
          this.form.controls.name.setValue(formula.data.nombre);
          this.form.controls.material.setValue(formula.data.material);
        }
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private postFormula(): void {
    let error: string = 'FormulaComponent => postFormula(): ';
    let body: IFormula = {
      nombre: this.form.controls.name.value,
      idMaterial: this.form.controls.material.value,
      norma: this.form.controls.norma.value,
    };
    this._formulas.post(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.openSnackBar(true);
          this._formulas.setMode('Edit');
          this.router.navigate([`/formulas/edit/${formula.data.id}`]);
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
    let error: string = 'FormulaComponent => putFormula(): ';
    let body: IFormula = {
      id: this.formula$.id,
      nombre: this.form.controls.name.value,
      idMaterial: this.form.controls.material.value,
      material: this.formula$.material,
      norma: this.form.controls.norma.value,
    };
    this._formulas.put(body).subscribe({
      next: (formula: IFormulaResponse) => {
        if (formula.status === 'OK') {
          this.openSnackBar(true);
          this._formulas.setMode('Edit');
          this.router.navigate([`/formulas/grid`]);
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
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
      material: [
        { value: null, disabled: this.mode === 'Edit' },
        Validators.required,
      ],
      norma: [
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
    });
  }

  private subscription(): void {
    this.suscripcion = this._formulas.events.subscribe((data: any) => {
      if (data === 1) this.close();
      if (data === 3) this.create();
      if (data[0] === 4) {
        this.idMachine = data[1];
        this.addMachine(data[1]);
        this.machine = data[2];
      }
    });
  }

  private openSnackBar(option: boolean): void {
    let message: string = option
      ? 'Cambios realizados.'
      : 'No se pudieron realizar los cambios.';
    let css: string = option ? 'green' : 'red';
    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }
}
