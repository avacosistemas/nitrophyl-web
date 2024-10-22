import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, Subscription, switchMap, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './assay-dialog-confirm/assay-dialog-confirm.component';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';
import { FormulasService } from 'app/shared/services/formulas.service';

// * Interfaces.
import {
  IConfigTest,
  IConfigTestResponse,
  IConfigTestsResponse,
} from 'app/shared/models/config-test.interface';
import { IFormula } from 'app/shared/models/formula.interface';

@Component({
  selector: 'abm-assays',
  templateUrl: './abm-assays.component.html',
})
export class ABMAssaysComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  public title: string = 'Ensayos';
  public lot: string = '';
  public drawer: boolean; // Drawer state.
  public machine: FormControl = new FormControl();
  public machines$: Observable<IConfigTest[]>; // Machines list.

  public subtitle: string;
  public formula: IFormula | undefined;

  private subscription: Subscription; // Drawer subscription.

  constructor(
    private configTestService: ConfigTestService,
    private assayService: AssayService,
    private router: Router,
    private _cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private formulasService: FormulasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    if (!this.assayService.lot || !this.assayService.lot.idFormula) {
      this.router.navigate(['../../lotes/grid']);
      return;
    }

    this.title = `Ensayos del Lote ${this.assayService.lot?.nroLote}`;
    this.lot = `Lote ${this.assayService.lot?.nroLote}`;

    this.formulasService.get({ id: this.assayService.lot.idFormula, labelCombo: '' }).subscribe({
      next: (response: { data: any }) => {
        if (response && response.data) {
          this.formula = response.data;
          this.subtitle = `Fórmula: ${this.formula.labelCombo}`;
        }
      },
      error: (error: any) => {
        console.error('Error al obtener la fórmula:', error);
      }
    });

    this.machines$ = this.configTestService
      .getMachinesVigentes(this.assayService.lot.idFormula)
      .pipe(
        map((res: IConfigTestsResponse | IConfigTestResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      );

    this.subscription = this.assayService.drawer$.subscribe(
      (drawer: boolean) => {
        this.drawer = drawer;
        if (drawer) {
          this.machine.disable();
        } else {
          this.machine.enable();
          this.machine.reset();
        }
      }
    );
  }


  public ngAfterContentChecked(): void {
    this._cdr.detectChanges();
  }

  public close(): void {
    this.router.navigate(['../../lotes/grid']);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public add(): void {
    if (this.drawer) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        dismissible: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'conResultados') {
        this.assayService.machine = this.machine.value;
        this.assayService.mode = 'create';
        this.assayService.toggleDrawer();
      } else if (result === 'sinResultados') {
        this.assayService.machine = this.machine.value;
        this.assayService.mode = 'create';
        this.addAssayWithoutResults();
      }
    });
  }

  private addAssayWithoutResults(): void {
    const assayData = {
      idConfiguracionPrueba: this.machine.value,
      idLote: this.assayService.lot.id,
    };

    this.assayService.postAssayWithoutResults(assayData).subscribe({
      next: () => {
        this.openSnackBar(true, 'Ensayo agregado sin resultados.');
        this.assayService.fetchAssays(this.assayService.lot.id); // Asegúrate de que esta línea se esté ejecutando.
      },
      error: (err: any) => {
        this.openSnackBar(false, 'Error al cargar el ensayo.');
      },
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
