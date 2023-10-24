import { AfterViewInit, Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

// * Services.
import { FormulasService } from 'app/shared/services/formulas.service';
import { MaterialsService } from 'app/shared/services/materials.service';

// * Interfaces.
import {
  IFormula,
  IFormulasResponse,
} from 'app/shared/models/formula.interface';
import { IMaterialsResponse } from 'app/shared/models/material.interface';

// * Forms.
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-formulas',
  templateUrl: './formulas.component.html',
})
export class FormulasComponent implements OnInit, AfterViewInit {
  private formulasBackUp$: IFormula[] = [];

  public component: string = 'all';

  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IFormula[] | undefined;

  public formulas$: IFormula[] | undefined;
  public displayedColumns: string[] = [
    'name',
    'material',
    'norma',
    'fecha',
    'version',
    'actions',
  ];

  public showSuccess: boolean = false;
  public showError: boolean = false;
  public panelOpenState: boolean = false;

  constructor(
    private _formulas: FormulasService,
    private _materials: MaterialsService,
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

  public version(name: string): number {
    const filteredFormulas = this.formulas$.filter(
      (formula: any) => formula.nombre === name
    );
    if (filteredFormulas.length > 0)
      return Math.max(...filteredFormulas.map((formula) => formula.version));

    return 0;
  }

  private loadData(): void {
    let error: string = 'FormulasComponent => loadData: ';
    forkJoin([
      this._materials.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._materials.get() ', err);
          this.materialsFail = true;
          this.form.controls.material.disable();
          return of([]);
        })
      ),
      this._formulas.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.get() ', err);
          return of([]);
        })
      ),
    ]).subscribe({
      next: ([materials, formulas]: [
        IMaterialsResponse,
        IFormulasResponse
      ]) => {
        this.materials$ = materials.data;
        this.formulas$ = formulas.data;
        this.formulasBackUp$ = formulas.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  public mode(option: number, row: any): void {
    switch (option) {
      case 1:
        this._formulas.setMode('Edit');
        break;
      case 2:
        this._formulas.setMode('View');
        break;
      case 3:
        this._formulas.setTestTitle(row);
        this._formulas.setMode('Test');
        break;
      default:
        break;
    }
  }

  public search(): void {
    if (!this.form.controls.name.value && !this.form.controls.material.value)
      this.formulas$ = this.formulasBackUp$;

    if (this.form.controls.name.value && this.form.controls.material.value)
      this.compare();

    if (this.form.controls.name.value && !this.form.controls.material.value)
      this.compareFormulas();

    if (!this.form.controls.name.value && this.form.controls.material.value)
      this.compareMaterials();
  }

  private compare(): void {
    this.formulas$ = this.formulasBackUp$.filter(
      (formula) =>
        formula.idMaterial === this.form.controls.material.value &&
        formula.nombre
          ?.toLowerCase()
          .includes(this.form.controls.name.value.toLowerCase())
    );
  }

  private compareFormulas(): void {
    this.formulas$ = this.formulasBackUp$.filter((formula: IFormula) =>
      formula.nombre
        ?.toLowerCase()
        .includes(this.form.controls.name.value.toLowerCase())
    );
  }

  private compareMaterials(): void {
    this.formulas$ = this.formulasBackUp$.filter(
      (formula: IFormula) =>
        formula.idMaterial === this.form.controls.material.value
    );
  }

  private setForm(): void {
    this.form = this.formBuilder.group({
      name: [null],
      material: [null],
      norma: [null],
    });
  }
}
