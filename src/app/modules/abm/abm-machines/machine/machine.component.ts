import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject, take, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// * Services.
import { MachinesService } from 'app/shared/services/machines.service';
import { TestService } from 'app/shared/services/test.service';

// * Interfaces.
import { IMachine, IMachineResponse } from 'app/shared/models/machine.model';
import { ITest } from 'app/shared/models/test.model';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// * Material.
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

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

  private testsBackUp$: ITest[] = [];
  private suscripcion: Subscription;
  private id: number;

  constructor(
    private cd: ChangeDetectorRef,
    private _machines: MachinesService,
    private _testService: TestService,
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    if (!this._machines.getMode()) { this.router.navigate(['/maquinas/grid']); }
    this.mode = this._machines.getMode();
    if (this.mode === 'Edit' || this.mode === 'View' || this.mode === 'Test') {
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
    }
    this.setForm();
    this.subscription();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public get tests$() {
    return this.tests.asObservable();
  }

  public ngOnInit(): void {
    if (this.mode === 'View' || this.mode === 'Edit') { this.get(); }
    if (this.mode === 'Test') { this.getTest(); }
    this.tests.next([]);
  }

  drop(event: CdkDragDrop<ITest[]>): void {
    this.tests$
      .pipe(
        take(1),
        map((tests) => {
          const previousIndex = tests.findIndex(
            test => test === event.item.data
          );

          if (previousIndex !== event.currentIndex) {
            moveItemInArray(tests, previousIndex, event.currentIndex);
            this.updatePositions();
            this.tests.next([...tests]);
            this.saveOrder();
          }
        })
      )
      .subscribe();
  }

  updatePositions(): void {
    this.tests$
      .pipe(
        take(1),
        map((tests) => {
          tests.forEach((test, index) => {
            test.posicion = index + 1;
          });
          this.tests.next([...tests]);
        })
      )
      .subscribe();
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
      this.router.navigate(['/maquinas/grid']);
      return;
    }

    if (
      this.mode === 'Create' ||
      this.mode === 'Edit' ||
      this.mode === 'View'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.form.pristine
        ? this.router.navigate(['/maquinas/grid'])
        : this.alert();
      return;
    }

    this.router.navigate(['/maquinas/grid']);
  }

  public create(): void {
    if (this.mode === 'Create' || this.mode === 'Edit') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      if (this.mode === 'Create') { this.post(); }
      if (this.mode === 'Edit') { this.put(); }
    }
  }

  public add(): void {
    const test: string | undefined = this.formTest.controls.test.value;

    if (!test || !test.trim()) {
      this.openSnackBar(false, 'El nombre de la prueba es obligatorio');
      return;
    }

    const currentTests = this.tests.value;

    if (currentTests.some(t => t.nombre === test.trim())) {
      this.openSnackBar(false, 'Ya existe una prueba con ese nombre');
      return;
    }

    const newTest: ITest = {
      idMaquina: this.id,
      nombre: test.trim(),
    };

    this._testService.addTest(newTest.idMaquina, newTest).subscribe({
      next: (response) => {
        const addedTest = response.data;

        // if (!addedTest || !addedTest.id) {
        //   this.openSnackBar(false, 'No se recibió un ID válido para la nueva prueba');
        //   return;
        // }

        currentTests.push({
          id: addedTest.id,
          idMaquina: addedTest.idMaquina,
          nombre: addedTest.nombre,
          posicion: addedTest.posicion,
        });

        const updatedTests = [...currentTests];

        this.tests.next(updatedTests);

        this._testService.updateTestPositions(updatedTests).subscribe({
          next: (res) => {
            if (res.status === 'OK') {
              this.openSnackBar(true);
            } else {
              this.openSnackBar(false);
            }
          },
          error: () => {
            this.openSnackBar(false, 'Error al actualizar las posiciones de las pruebas.');
          }
        });
      },
      error: () => {
        this.openSnackBar(false, 'Error al agregar la nueva prueba.');
      }
    });

    this.formTest.reset();
  }

  public trash(id: number): void {
    const dialog = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '50%',
      data: {
        data: null,
        seccion: 'prueba',
        boton: 'Eliminar'
      },
    });

    dialog.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this._testService.deleteTest(id).subscribe({
          next: () => {
            this.openSnackBar(true, 'Prueba eliminada.');
            const currentTests = this.tests.value;
            const updatedTests = currentTests.filter(test => test.id !== id);
            const reorderedTests = updatedTests.map((test, index) => ({
              ...test,
              posicion: index + 1
            }));

            this.tests.next(reorderedTests);
            this._testService.updateTestPositions(reorderedTests).subscribe({
              next: () => {
                this.openSnackBar(true, 'Posiciones actualizadas.');
              },
              error: () => {
                this.openSnackBar(false, 'Error al actualizar posiciones.');
              }
            });
          },
          error: () => {
            this.openSnackBar(false, 'Error al eliminar la prueba.');
          }
        });
      }
    });
  }

  private getTest(): void {
    this._testService.getTest(this.id).subscribe({
      next: (res: any) => {
        if (res.status === 'OK' && res.data) {
          this.tests.next(res.data.sort((a, b) => a.posicion - b.posicion));
        } else {
          this.openSnackBar(false, 'La respuesta no tiene el formato esperado.');
        }
      },
      error: () => this.openSnackBar(false, 'Error al obtener las prueba.'),
    });
  }

  private saveOrder(): void {
    this.tests$
      .pipe(
        take(1),
        switchMap(updatedTests => this._testService.updateTestPositions(updatedTests))
      )
      .subscribe({
        next: (result) => {
          if (result.status === 'OK') {
            this.openSnackBar(true);
          } else {
            this.openSnackBar(false);
          }
        },
        error: () => {
          this.openSnackBar(false, 'Error al actualizar el orden de las pruebas.');
        }
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
          this.form.controls.norma.setValue(data[0].norma);
          this.form.controls.versionable.setValue(!!data[0].versionable);
          this.form.controls.observacionesReporte.setValue(data[0].observacionesReporte);
          this.cd.detectChanges();
        }
      },
      error: () => this.openSnackBar(false, 'Error al obtener las Maquinas.'),
    });
  }

  private post(): void {
    const body: IMachine = {
      nombre: this.form.controls.name.value,
      estado: this.form.controls.status.value,
      norma: this.form.controls.norma.value,
      versionable: this.form.controls.versionable.value,
      observacionesReporte: this.form.controls.observacionesReporte.value,
    };
    this._machines.post(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          const data = Array.isArray(res.data)
            ? (res.data as IMachine[])
            : [res.data as IMachine];
          this.openSnackBar(true);
          this.form.markAsPristine();
          // this._machines.setMode('Edit');
          // this.router.navigate([`/maquinas/edit/${data[0].id}`]);
          this.router.navigate(['/maquinas/grid']);
        }
      },
      error: () => {
        this.openSnackBar(false);
      },
      complete: () => { },
    });
  }

  private put(): void {
    const body: IMachine = {
      id: this.id,
      nombre: this.form.controls.name.value,
      estado: this.form.controls.status.value,
      norma: this.form.controls.norma.value,
      versionable: this.form.controls.versionable.value,
      observacionesReporte: this.form.controls.observacionesReporte.value,
    };
    this._machines.put(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          const data = Array.isArray(res.data)
            ? (res.data as IMachine[])
            : [res.data as IMachine];
          this.openSnackBar(true);
          this.form.markAsPristine();
          this._machines.setMode('Edit');
          this.router.navigate([`/maquinas/edit/${data[0].id}`]);
        }
      },
      error: () => {
        this.openSnackBar(false);
      },
      complete: () => { },
    });
  }

  private setForm(): void {
    if (this.mode === 'Test') {
      this.formTest = this.formBuilder.group({
        test: null,
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
      norma: [
        { value: null, disabled: this.mode === 'View' },
        Validators.compose([
          Validators.maxLength(100),
        ]),
      ],
      versionable: [
        { value: false, disabled: this.mode === 'View' }
      ],
      observacionesReporte: [
        { value: '', disabled: this.mode === 'View' }
      ],
    });
  }

  private subscription(): void {
    this.suscripcion = this._machines.events.subscribe((data: any) => {
      if (data === 1) { this.close(); }
      if (data === 3) { this.create(); }
    });
  }

  private alert(): void {
    const dialog = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '50%',
      data: { data: null, seccion: 'maquinas', boton: 'Cerrar' },
    });
    dialog.afterClosed().subscribe((res: boolean) => {
      if (res) { this.router.navigate(['/maquinas/grid']); }
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
