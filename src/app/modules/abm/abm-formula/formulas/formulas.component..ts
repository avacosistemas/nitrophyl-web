import { AfterViewInit, Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

// * Services.
import { FormulaService } from 'app/shared/services/formula.service';

// * Interfaces.

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IFormula,
  IFormulaResponse,
  IMaterial,
  IMaterialResponse,
} from 'app/shared/models/formula.model';

// import { MatDialog } from '@angular/material/dialog';
// import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
// import { Molde } from 'app/shared/models/molde.model';

@Component({
  selector: 'app-formulas',
  templateUrl: './formulas.component.html',
})
export class FormulasComponent implements OnInit, AfterViewInit {
  private formulasBackUp$: IFormula[] = [];

  public component: string = 'all';

  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IMaterial[] | undefined;

  public formulasFail: boolean = false;
  public formulas$: IFormula[] | undefined;
  public displayedColumns: string[] = ['formula', 'material', 'actions'];

  public showSuccess: boolean = false;
  public showError: boolean = false;
  public panelOpenState: boolean = false;

  constructor(
    private _formulas: FormulaService,
    private formBuilder: FormBuilder
  ) {
    this.setForm();
  }

  public ngOnInit(): void {
    this.loadData();
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  private loadData(): void {
    let error: string = 'ABMFormulaGrillaComponent. ngOnInit => loadData: ';
    forkJoin([
      this._formulas.getMaterials().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.getMaterials() ', err);
          this.materialsFail = true;
          this.form.controls.material.disable();
          return of([]);
        })
      ),
      this._formulas.getFormulas().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.getFormulas() ', err);
          this.formulasFail = true;
          return of([]);
        })
      ),
    ]).subscribe({
      next: ([materials, formulas]: [IMaterialResponse, IFormulaResponse]) => {
        this.materials$ = materials.data;
        this.formulas$ = formulas.data;
        this.formulasBackUp$ = formulas.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  public mode(option: number): void {
    switch (option) {
      case 1:
        this._formulas.setMode('Edit');
        break;
      case 2:
        this._formulas.setMode('View');
        break;
      default:
        break;
    }
  }

  public search(): void {
    if (!this.form.controls.nombre.value && !this.form.controls.material.value)
      this.formulas$ = this.formulasBackUp$;

    if (this.form.controls.nombre.value && this.form.controls.material.value)
      this.compareAll();

    if (this.form.controls.nombre.value && !this.form.controls.material.value)
      this.compareFormulas();

    if (!this.form.controls.nombre.value && this.form.controls.material.value)
      this.compareMaterials();
  }

  private compareAll(): void {
    this.formulas$ = this.formulasBackUp$.filter(
      (formula) =>
        formula.idMaterial === this.form.controls.material.value &&
        formula.nombre
          ?.toLowerCase()
          .includes(this.form.controls.nombre.value.toLowerCase())
    );
  }

  private compareFormulas(): void {
    this.formulas$ = this.formulasBackUp$.filter((formula: IFormula) =>
      formula.nombre
        ?.toLowerCase()
        .includes(this.form.controls.nombre.value.toLowerCase())
    );
  }

  private compareMaterials(): void {
    this.formulas$ = this.formulasBackUp$.filter(
      (formula: IFormula) =>
        formula.idMaterial === this.form.controls.material.value
    );
  }

  private getFormulas(body?: IFormula): void {
    this._formulas.getFormulas(body).subscribe({
      next: (res: IFormulaResponse) => (this.formulas$ = res.data),
      error: (err: any) => console.error('getFormulas(): ', err),
      complete: () => {},
    });
  }

  private setForm(): void {
    this.form = this.formBuilder.group({ nombre: [null], material: [null] });
  }
}
