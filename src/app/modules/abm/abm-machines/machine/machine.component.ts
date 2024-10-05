import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';

// * Services.
import { MachinesService } from 'app/shared/services/machines.service';

// * Interfaces.
import { IMachine, IMachineResponse } from 'app/shared/models/machine.model';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// * Material.
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

export interface ITest {
  id?: number | null;
  idMaquina: number;
  nombre: string;
  posicion: number;
}

@Component({
  selector: 'app-machine',
  templateUrl: './machine.component.html',
  styleUrls: ['./machine.component.scss'],
})
export class MachineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('table', { static: true }) table: MatTable<ITest>;

  public mode: string;
  public form: FormGroup;
  public component: string = 'Mode';

  public formTest: FormGroup;
  public displayedColumns: string[] = ['position', 'name', 'actions'];

  // * BehaviorSubject for tests
  public tests: BehaviorSubject<ITest[]> = new BehaviorSubject<ITest[]>([]);

  // * Test mode.
  private save: boolean = true;

  private suscripcion: Subscription;
  private id: number;
  constructor(
    private _machines: MachinesService,
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    if (!this._machines.getMode()) this.router.navigate(['/maquinas/grid']);
    this.mode = this._machines.getMode();
    if (this.mode === 'Edit' || this.mode === 'View' || this.mode === 'Test') {
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
    }
    this.setForm();
    this.subscription();
  }

  public get tests$() {
    return this.tests.asObservable();
  }

  public ngOnInit(): void {
    if (this.mode === 'View' || this.mode === 'Edit') {this.get();}
    if (this.mode === 'Test') {this.getTest();}
    this.tests.next([]);
  }

  drop(event: CdkDragDrop<ITest[]>): void {
    const previousIndex = this.tests.value.findIndex(
      d => d === event.item.data
    );

    moveItemInArray(this.tests.value, previousIndex, event.currentIndex);

    this.updatePositions();

    if (this.table) {
      this.table.renderRows();
    }

    this.tests.next([...this.tests.value]);
  }

  updatePositions(): void {
    const currentTests = this.tests.value;
    currentTests.forEach((test, index) => {
      test.posicion = index + 1;
    });
    this.tests.next([...currentTests]);
  }

  public ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public close(): void {
    if (this.mode === 'Test') {
      this.save ? this.router.navigate(['/maquinas/grid']) : this.alert();
      return;
    }

    if (
      this.mode === 'Create' ||
      this.mode === 'Edit' ||
      this.mode === 'View'
    ) {
      this.form.pristine
        ? this.router.navigate(['/maquinas/grid'])
        : this.alert();
      return;
    }

    this.router.navigate(['/maquinas/grid']);
  }

  public create(): void {
    if (this.mode === 'Test') {this.setTests();}
    if (this.mode === 'Create' || this.mode === 'Edit') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      if (this.mode === 'Create') {this.post();}
      if (this.mode === 'Edit') {this.put();}
    }
  }

  public add(): void {
    const test: string | undefined = this.formTest.controls.test.value;
    let position: number | undefined =
      this.formTest.controls.positionTest.value;

    if (!test || !test.trim()) {
      this.snackBar.open('El nombre de la prueba es obligatorio.', 'X', {
        duration: 5000,
        panelClass: 'red-snackbar',
      });
      return;
    }

    const currentTests = this.tests.value;

    if (currentTests.some(t => t.nombre === test)) {
      this.snackBar.open('Ya existe una prueba con ese nombre', 'X', {
        duration: 5000,
        panelClass: 'red-snackbar',
      });
      return;
    }

    if (position === undefined || position === null) {
      position =
        currentTests.length > 0
          ? Math.max(...currentTests.map(t => t.posicion)) + 1
          : 1;
    }

    currentTests.forEach((t) => {
      if (t.posicion >= position) {
        t.posicion += 1;
      }
    });

    const newTest: ITest = {
      id: null,
      idMaquina: this.id,
      nombre: test.trim(),
      posicion: position,
    };

    const updatedTests = [...currentTests, newTest];

    updatedTests.sort((a, b) => a.posicion - b.posicion);

    this.tests.next(updatedTests);

    this.formTest.patchValue({
      test: null,
      positionTest: null,
    });

    this.formTest.markAsUntouched();
    this.formTest.markAsPristine();
  }

  public trash(id: number): void {
    const currentTests = this.tests.value;

    const updatedTests = currentTests.filter(test => test.id !== id);
    this.tests.next(updatedTests);

    this.updatePositions();
    this.save = false;
  }

  private getTest(): void {
    const error: string = 'MachineComponent => getTest(): ';
    this._machines.getTest(this.id).subscribe({
      next: (res: any) => {
        this.tests.next([...res.data]);
      },
      error: (err: any) => console.error(error, err),
    });
  }

  private get(): void {
    const error: string = 'MachineComponent => get(): ';
    const body: IMachine = { id: this.id };
    this._machines.get(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          const data = Array.isArray(res.data)
            ? (res.data as IMachine[])
            : [res.data as IMachine];
          this.form.controls.name.setValue(data[0].nombre);
          this.form.controls.status.setValue(data[0].estado);
          this.form.controls.position.setValue(data[0].posicion);
          this.form.controls.observacionesReporte.setValue(
            data[0].observacionesReporte
          );
        }
      },
      error: (err: any) => console.error(error, err),
    });
  }

  private post(): void {
    const error: string = 'MachineComponent => post(): ';
    const body: IMachine = {
      nombre: this.form.controls.name.value,
      estado: this.form.controls.status.value,
      posicion: this.form.controls.position.value,
      observacionesReporte: this.form.controls.observacionesReporte.value,
    };
    this._machines.post(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          const data = Array.isArray(res.data)
            ? (res.data as IMachine[])
            : [res.data as IMachine];
          this.openSnackBar(true);
          // this._machines.setMode('Edit');
          // this.router.navigate([`/maquinas/edit/${data[0].id}`]);
          this.router.navigate(['/maquinas/grid']);
        }
      },
      error: (err) => {
        this.openSnackBar(false);
        console.error(error, err);
      },
      complete: () => {},
    });
  }

  private put(): void {
    const error: string = 'MachineComponent => put(): ';
    const body: IMachine = {
      id: this.id,
      nombre: this.form.controls.name.value,
      estado: this.form.controls.status.value,
      posicion: this.form.controls.position.value,
      observacionesReporte: this.form.controls.observacionesReporte.value,
    };
    this._machines.put(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          const data = Array.isArray(res.data)
            ? (res.data as IMachine[])
            : [res.data as IMachine];
          this.openSnackBar(true);
          this._machines.setMode('Edit');
          this.router.navigate([`/maquinas/edit/${data[0].id}`]);
        }
      },
      error: (err) => {
        this.openSnackBar(false);
        console.error(error, err);
      },
      complete: () => {},
    });
  }

  private setTests(): void {
    const error: string = 'MachineComponent => setTests(): ';
    const testsArray = this.tests.value;

    const body: any = {
      idMaquina: this.id,
      moldeClientesListadoDTOs: testsArray,
    };

    this._machines.setTest(body).subscribe({
      next: (res: any) => {
        if (res.status === 'OK') {
          this.openSnackBar(true);
          this.router.navigate(['/maquinas/grid']);
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
    if (this.mode === 'Test') {
      this.formTest = this.formBuilder.group({
        test: null,
        positionTest: null,
      });
      this.form = null;
      return;
    }

    this.formTest = null;
    this.form = this.formBuilder.group({
      name: [
        { value: null, disabled: this.mode === 'View' },
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
      status: [
        { value: null, disabled: this.mode === 'View' },
        Validators.required,
      ],
      position: [
        { value: null, disabled: this.mode === 'View' },
        Validators.required,
      ],
      observacionesReporte: [],
    });
  }

  private subscription(): void {
    this.suscripcion = this._machines.events.subscribe((data: any) => {
      if (data === 1) {this.close();}
      if (data === 3) {this.create();}
    });
  }

  private alert(): void {
    const dialog = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '50%',
      data: { data: null, seccion: 'maquinas', boton: 'Cerrar' },
    });
    dialog.afterClosed().subscribe((res: boolean) => {
      if (res) {this.router.navigate(['/maquinas/grid']);}
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
