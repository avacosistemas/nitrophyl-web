import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith, Subscription } from 'rxjs';

// * Services.
import { LotService } from 'app/shared/services/lot.service';
import { FormulasService } from 'app/shared/services/formulas.service';

// * Interfaces.
import { ILot, ILotsResponse } from 'app/shared/models/lot.interface';
import {
  IFormula,
  IFormulaResponse,
  IFormulasResponse,
} from 'app/shared/models/formula.interface';

// * Material.
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

@Component({
  selector: 'app-lots',
  templateUrl: './lots.component.html',
})
export class LotsComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public drawer: boolean; // Drawer state.
  public lots$: Observable<ILot[]>; // Lotes.
  public formulas$: Observable<IFormula[]>; // Formulas.

  // * Form (create).
  public form: FormGroup = new FormGroup({
    lot: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(5),
      Validators.pattern(/^[A-Za-z]\d{4}$/),
    ]),
    formula: new FormControl(null, Validators.required),
    observation: new FormControl(null, Validators.maxLength(255)),
  });
  public formulas: IFormula[]; // AutoComplete.

  // * Table.
  public displayedColumns: string[] = [
    'nroLote',
    'fecha',
    'formula',
    'observaciones',
    'actions',
  ];

  private subscription: Subscription; // Drawer subscription.

  constructor(
    private lotService: LotService,
    private formulaService: FormulasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  public ngOnInit(): void {
    this.lots$ = this.lotService
      .get()
      .pipe(map((res: ILotsResponse) => res.data));

    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
        this.formulas$ = this.form.controls['formula'].valueChanges.pipe(
          startWith(''),
          map((value: IFormula) =>
            typeof value === 'string' ? value : value?.nombre
          ),
          map((name: string) =>
            name ? this._filter(name) : this.formulas.slice()
          )
        );
      });

    this.subscription = this.lotService.drawer$.subscribe((drawer: boolean) => {
      this.drawer = drawer;
    });
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const lot: {
      idFormula: number;
      nroLote: string;
      observaciones: string;
    } = {
      idFormula: this.form.controls['formula'].value.id,
      nroLote: this.form.controls['lot'].value,
      observaciones: this.form.controls['observation'].value ?? '',
    };

    this._post(lot);
  }

  public close(): void {
    if (!this.form.pristine) {
      const dialog = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: '', boton: 'Cerrar' },
      });
      dialog.afterClosed().subscribe((res: boolean) => {
        if (res) {
          this._reset();
        }
      });
    } else {
      this._reset();
    }
  }

  public ngOnDestroy(): void {
    this.form.reset();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private _filter(name: string): IFormula[] {
    return this.formulas.filter(
      (formula: IFormula) =>
        formula.nombre.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  private _post(lot: ILot): void {
    const error: string = 'abm-lots => lots.component.ts => _post() =>';

    this.lotService.post(lot).subscribe({
      next: () => {
        this._snackBar(true);
        this._reset();
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false);
      },
    });
  }

  private _snackBar(option: boolean): void {
    const message: string = option
      ? 'Cambios realizados correctamente.'
      : 'No se han podido realizar los cambios.';
    const css: string = option ? 'green' : 'red';
    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }

  private _reset(): void {
    this.form.reset();
    this.lotService.toggleDrawer();
  }
}
