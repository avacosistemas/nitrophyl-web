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
  forkJoin,
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
  IFormulaResponse
} from 'app/shared/models/formula.interface';
import {
  IMaterial,
  IMaterialsResponse,
} from 'app/shared/models/material.interface';

// * Forms.
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

// * Materials.
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { FormulaTestModalComponent } from '../formula-test-modal/formula-test-modal.component';

@Component({
  selector: 'app-formula',
  templateUrl: './formula.component.html',
})
export class FormulaComponent implements OnInit, AfterViewInit, OnDestroy {

  public mode: string;
  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IMaterial[] | undefined;

  public machine: string = '';
  public formTest: FormGroup;
  public formTestMachine: FormGroup;
  public rpdto: any;

  public revision$: any;
  public machines$: any;
  public machinesForm$: any[] = [];
  public displayedColumnsMachines: string[] = ['name', 'vigente', 'fecha', 'fechaHasta', 'revision'];

  public component: string = 'Mode';

  public currentTestId: number;

  private suscripcion: Subscription;
  private formula$: IFormula;
  private id: number;
  private idMachine: number;

  constructor(
    private _materials: MaterialsService,
    private _formulas: FormulasService,
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
    this.currentTestId = id;
    const dialogRef = this.dialog.open(FormulaTestModalComponent, {
      width: '50%',
      data: { testId: id, machine: this.machine, currentTestId: this.currentTestId, id: this.id, machineId: this.idMachine },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMachines();
        this._formulas.work(false);
      }
    });
  }

  public addMachineForm(): void {
    if (this.formTestMachine.invalid) {
      return;
    }

    const machine: any = this.formTestMachine.controls.machine;
    this.idMachine = machine.value.id;
    const machineName = machine.value.nombre;
    const machineNorma = machine.value.norma;
    const machineVersionable = machine.value.versionable;

    this._configTest.getMachines(this.id).subscribe({
      next: (response: any) => {
        const isMachineAlreadyAdded = response.data.some(
          (m: any) => m.idMaquina === this.idMachine
        );

        if (isMachineAlreadyAdded && !machineVersionable) {
          this.openSnackBar(false, 'La máquina no es versionable y ya existe.');
          return;
        }
        this.machine = machineName;
        this.openTestModal(this.idMachine, machineName, machineNorma);
        machine.reset();
      },
      error: (err: any) => {
        console.error('Error al consultar las máquinas:', err);
      },
    });
  }

  generarNuevaRevision(): void {
    this._formulas.marcarRevision(this.id).subscribe({
      next: (response) => {
        this.openSnackBar(true, `Revisión ${response.data.revision} generada con éxito`);
        this.getRevision();
        this.getMachines();
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
      complete: () => { },
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
      complete: () => { },
    });
  }

  private getMachines(): void {
    const error: string = 'formula.component.ts => getMachines() => ';
    this._configTest.getMachines(this.id).subscribe({
      next: (res: any) => {
        this.machines$ = [...res.data];
      },
      error: (err: any) => console.error(error, err),
      complete: () => { },
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
      complete: () => { },
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
      complete: () => { },
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
      complete: () => { },
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
      complete: () => { },
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
      complete: () => { },
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
        { value: null, disabled: this.mode === 'Edit' },
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
    });
  }

  private openTestModal(machineId: number, machineName: string, machineNorma: string): void {
    const dialogRef = this.dialog.open(FormulaTestModalComponent, {
      width: '50%',
      data: { machineId, machine: machineName, machineNorma, currentTestId: this.currentTestId, id: this.id },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMachines();
        this._formulas.work(false);
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
