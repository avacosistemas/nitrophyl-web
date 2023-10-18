import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

// * Services.
import { MachinesService } from 'app/shared/services/machines.service';

// * Interfaces.
import { IMachine, IMachineResponse } from 'app/shared/models/machine.model';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// * Material.
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

@Component({
  selector: 'app-machine',
  templateUrl: './machine.component.html',
})
export class MachineComponent implements OnInit, AfterViewInit, OnDestroy {
  private suscripcion: Subscription;
  private id: number;

  public mode: string;
  public form: FormGroup;
  public component: string = 'Mode';

  // * Test mode.
  private save: boolean = true;

  public formTest: FormGroup;
  public tests$: string[] = [];
  public displayedColumns: string[] = ['test', 'actions'];

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
    if (this.mode === 'Edit' || 'View' || 'Test')
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
    this.setForm();
    this.subscription();
  }

  public ngOnInit(): void {
    if (this.mode === 'View' || this.mode === 'Edit') this.get();
    if (this.mode === 'Test') this.getTest();
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
      this.save ? this.router.navigate(['/maquinas/grid']) : this.alert();
      return;
    }

    if (this.mode === 'Create' || 'Edit' || 'View') {
      this.form.pristine
        ? this.router.navigate(['/maquinas/grid'])
        : this.alert();
      return;
    }

    this.router.navigate(['/maquinas/grid']);
  }

  public create(): void {
    if (this.mode === 'Test') this.setTests();
    if (this.mode === 'Create' || this.mode === 'Edit') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      if (this.mode === 'Create') this.post();
      if (this.mode === 'Edit') this.put();
    }
  }

  public add(): void {
    let test: string | undefined = this.formTest.controls.test.value;
    if (test === undefined) return;
    if (this.tests$.includes(test)) {
      this.snackBar.open('Ya existe una prueba con ese nombre', 'X', {
        duration: 5000,
        panelClass: `red-snackbar`,
      });
      return;
    }
    this.save = false;
    this.tests$.push(this.formTest.controls.test.value);
    this.tests$ = [...this.tests$];
  }

  public trash(row: any): void {
    let i: number = this.tests$.indexOf(row);
    if (i !== -1) {
      this.tests$.splice(i, 1);
      this.tests$ = [...this.tests$];
      this.save = false;
    }
  }

  private getTest(): void {
    let error: string = 'MachineComponent => get(): ';
    this._machines.getTest(this.id).subscribe({
      next: (res: any) => (this.tests$ = [...res.data]),
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private get(): void {
    let error: string = 'MachineComponent => get(): ';
    let body: IMachine = { id: this.id };
    this._machines.get(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          let data = Array.isArray(res.data)
            ? (res.data as IMachine[])
            : [res.data as IMachine];
          this.form.controls.name.setValue(data[0].nombre);
          this.form.controls.status.setValue(data[0].estado);
        }
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private post(): void {
    let error: string = 'MachineComponent => post(): ';
    let body: IMachine = {
      nombre: this.form.controls.name.value,
      estado: this.form.controls.status.value,
    };
    this._machines.post(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          let data = Array.isArray(res.data)
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

  private put(): void {
    let error: string = 'MachineComponent => put(): ';
    let body: IMachine = {
      id: this.id,
      nombre: this.form.controls.name.value,
      estado: this.form.controls.status.value,
    };
    this._machines.put(body).subscribe({
      next: (res: IMachineResponse) => {
        if (res.status === 'OK') {
          let data = Array.isArray(res.data)
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
    let error: string = 'MachineComponent => putTest(): ';
    let body: any = {
      idMaquina: this.id,
      moldeClientesListadoDTOs: this.tests$,
    };
    this._machines.setTest(body).subscribe({
      next: (res: any) => {
        if (res.status === 'OK') {
          this.openSnackBar(true);
          this.router.navigate([`/maquinas/grid`]);
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
      this.form = null;
      this.formTest = this.formBuilder.group({
        test: null,
      });
      return;
    } else {
      this.formTest = null;
    }

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
    });
  }

  private subscription(): void {
    this.suscripcion = this._machines.events.subscribe((data: any) => {
      if (data === 1) this.close();
      if (data === 3) this.create();
    });
  }

  private alert(): void {
    const dialog = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '50%',
      data: { data: null, seccion: 'maquinas', boton: 'Cerrar' },
    });
    dialog.afterClosed().subscribe((res: boolean) => {
      if (res) this.router.navigate(['/maquinas/grid']);
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
