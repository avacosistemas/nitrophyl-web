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
    if (this.mode === 'Edit' || this.mode === 'View')
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
    this.setForm();
    this.subscription();
  }

  public ngOnInit(): void {
    if (this.mode === 'View' || this.mode === 'Edit') this.get();
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
    if (this.form.pristine == true) {
      this.router.navigate(['/maquinas/grid']);
    } else {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: 'maquinas', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) this.router.navigate(['/maquinas/grid']);
      });
    }
  }

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.mode === 'Create') this.post();
    if (this.mode === 'Edit') this.put();
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

  private setForm(): void {
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
