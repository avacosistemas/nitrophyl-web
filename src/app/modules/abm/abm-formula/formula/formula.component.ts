import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, Subscription } from 'rxjs';

// * Services.
import { FormulaService } from 'app/shared/services/formula.service';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import {
  IFormula,
  IFormulaResponse,
  IMaterial,
  IMaterialResponse,
} from 'app/shared/models/formula.model';

@Component({
  selector: 'app-formula',
  templateUrl: './formula.component.html',
})
export class FormulaComponent implements OnInit, AfterViewInit, OnDestroy {
  private suscripcion: Subscription;
  private formula$: IFormula;
  private id: number;

  public mode: string;
  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IMaterial[] | undefined;

  public component: string = 'Mode';

  constructor(
    private _formulas: FormulaService,
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    if (!this._formulas.getMode()) this.router.navigate(['/formulas/grid']);
    this.mode = this._formulas.getMode();
    if (this.mode === 'Edit' || this.mode === 'View')
      this.activeRoute.paramMap.subscribe(
        (param: any) => (this.id = param.get('id'))
      );
    this.setForm();
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
      default:
        break;
    }
  }

  private loadData(): void {
    let error: string = 'FormulaComponent. ngOnInit => loadData: ';
    forkJoin([
      this._formulas.getMaterials().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.getMaterials() ', err);
          this.materialsFail = true;
          return of([]);
        })
      ),
      this._formulas.getFormula(this.id).pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.getFormulas() ', err);
          return of([]);
        })
      ),
    ]).subscribe({
      next: ([materials, formula]: [IMaterialResponse, IFormulaResponse]) => {
        let data = Array.isArray(formula.data)
          ? (formula.data as IFormula[])
          : [formula.data as IFormula];
        this.form.controls.nombre.setValue(data[0].nombre);
        this.formula$ = data[0];
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
        this.form.controls.material.setValue(data[0].idMaterial);
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
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

  private getMaterials(): void {
    let error: string = 'FormulaComponent => getMaterials(): ';
    this._formulas.getMaterials().subscribe({
      next: (res: IMaterialResponse) => (this.materials$ = res.data),
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
    this._formulas.getFormula(this.id).subscribe({
      next: (res: IFormulaResponse) => {
        if (res.status === 'OK') {
          let data = Array.isArray(res.data)
            ? (res.data as IFormula[])
            : [res.data as IFormula];
          this.form.controls.nombre.setValue(data[0].nombre);
          this.form.controls.material.setValue(data[0].material);
        }
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private postFormula(): void {
    let error: string = 'FormulaComponent => postFormula(): ';
    let body: IFormula = {
      nombre: this.form.controls.nombre.value,
      idMaterial: this.form.controls.material.value,
    };
    this._formulas.post(body).subscribe({
      next: (res: IFormulaResponse) => {
        if (res.status === 'OK') {
          let data = Array.isArray(res.data)
            ? (res.data as IFormula[])
            : [res.data as IFormula];
          this._formulas.setMode('View');
          this.router.navigate([`/formulas/view/${data[0].id}`]);
        }
      },
      error: (err) => console.error(error, err),
      complete: () => {},
    });
  }

  private putFormula(): void {
    let error: string = 'FormulaComponent => putFormula(): ';
    let body: IFormula = {
      id: this.formula$.id,
      nombre: this.form.controls.nombre.value,
      idMaterial: this.form.controls.material.value,
      material: this.formula$.material,
    };
    this._formulas.put(body).subscribe({
      next: (res: IFormulaResponse) => {
        if (res.status === 'OK') {
          let data = Array.isArray(res.data)
            ? (res.data as IFormula[])
            : [res.data as IFormula];
          this._formulas.setMode('View');
          this.router.navigate([`/formulas/view/${data[0].id}`]);
        }
      },
      error: (err) => console.error(error, err),
      complete: () => {},
    });
  }

  private setForm(): void {
    this.form = this.formBuilder.group({
      nombre: [
        { value: null, disabled: this.mode === 'View' },
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
        ]),
      ],
      material: [
        { value: null, disabled: this.mode === 'View' },
        Validators.required,
      ],
    });
  }

  private subscription(): void {
    this.suscripcion = this._formulas.events.subscribe((data: any) => {
      if (data === 1) this.close();
      if (data === 3) this.create();
    });
  }
}
