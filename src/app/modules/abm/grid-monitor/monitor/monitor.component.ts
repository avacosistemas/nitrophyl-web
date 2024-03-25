import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith, Subscription } from 'rxjs';

// * Services.
import { LotService } from 'app/shared/services/lot.service';

// * Interfaces.
import { ILot, ILotsResponse } from 'app/shared/models/lot.interface';

// * Material.
import { MatSnackBar } from '@angular/material/snack-bar';

// * Dialogs.
import { DatePipe } from '@angular/common';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-lots',
  templateUrl: './monitor.component.html',
})
export class MonitorComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public drawer: boolean; // Drawer state.
  public lots$: Observable<ILot[]>; // Lotes..

  // * Form (create).
  public form: FormGroup = new FormGroup({
    lot: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(5),
      Validators.pattern(/^[A-Za-z]\d{4}$/),
    ]),
    date: new FormControl(new Date(), Validators.required),
    formula: new FormControl(null, Validators.required),
    observation: new FormControl(null, Validators.maxLength(255)),
  });

  // * Table.
  public displayedColumns: string[] = [
    'estado',
    'nroLote',
    'formula',
    'fechaEstado',
/*    'observaciones',
    'fechaEstado',
    'observacionesEstado',
    'actions',*/
  ];

  private subscription: Subscription; // Drawer subscription.

  constructor(
    private lotService: LotService,
    private router: Router,
    private snackBar: MatSnackBar,
    private _dPipe: DatePipe,
    private dateAdapter: DateAdapter<Date>
  ) { this.dateAdapter.setLocale('es');}

  public ngOnInit(): void {
    this.lots$ = this.lotService
      .getMonitor()
      .pipe(map((res: ILotsResponse) => res.data));

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

  public create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const date: string = this._dPipe.transform(
      this.form.controls['date'].value,
      'dd/MM/yyyy'
    );

    const lot: {
      idFormula: number;
      nroLote: string;
      observaciones: string;
      fechaEstado: string;
    } = {
      idFormula: this.form.controls['formula'].value.id,
      nroLote: this.form.controls['lot'].value,
      observaciones: this.form.controls['observation'].value ?? '',
      fechaEstado: date,
    };

    this._post(lot);
  }


  public ngOnDestroy(): void {
    this.form.reset();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private _post(lot: ILot): void {
    const error: string = 'grid-monitor => monitor.component.ts => _post() =>';

    this.lotService.post(lot).subscribe({
      next: () => {
        this._snackBar(true);
        this._reset();
        this.lots$ = this.lotService
          .get()
          .pipe(map((res: ILotsResponse) => res.data));
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
