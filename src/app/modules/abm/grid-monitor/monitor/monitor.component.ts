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
import { IFormula, IFormulaResponse, IFormulasResponse } from 'app/shared/models/formula.interface';
import { FormulasService } from 'app/shared/services/formulas.service';
import * as moment from 'moment';

@Component({
  selector: 'app-lots',
  templateUrl: './monitor.component.html',
})
export class MonitorComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public drawer: boolean; // Drawer state.
  public lots$: ILot[] | undefined; // Lotes..
  private lotsBackUp$: ILot[] = [];
  public panelOpenState: boolean = false;
  public lotsFail: boolean = false;
  public formulas$: Observable<IFormula[]>; // Formulas.
  public formulas: IFormula[]; // AutoComplete.

  // * Form (create).
  public form: FormGroup = new FormGroup({
    nroLote: new FormControl('', [
      Validators.minLength(5),
      Validators.maxLength(5),
      Validators.pattern(/^[A-Za-z]\d{4}$/),
    ]),
    fechaDesde: new FormControl(null),
    fechaHasta: new FormControl(null),
    idFormula: new FormControl(null)
  });

  // * Table.
  public displayedColumns: string[] = [
    'estado',
    'nroLote',
    'formula',
    'fecha'
  ];

  private subscription: Subscription; // Drawer subscription.

  constructor(
    private lotService: LotService,
    private router: Router,
    private snackBar: MatSnackBar,
    private _dPipe: DatePipe,
    private formulaService: FormulasService,
    private dateAdapter: DateAdapter<Date>
  ) { this.dateAdapter.setLocale('es');}


  
  private get(): void {
    let error: string = 'MonitorComponent => get(): ';
    this.lotService.get().subscribe({
      next: (res: ILotsResponse) => {
        this.lots$ = res.data;
        this.lotsBackUp$ = res.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }


  public ngOnInit(): void {
    this.get();

    this.subscription = this.lotService.drawer$.subscribe((drawer: boolean) => {
      this.drawer = drawer;
    });

    this.formulaService
      .get()
      .pipe(
        map((res: IFormulasResponse | IFormulaResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      )
      .subscribe((formulas: IFormula[]) => {
        this.formulas = formulas;
        this.formulas$ = this.form.controls['idFormula'].valueChanges.pipe(
          startWith(''),
          map((value: IFormula) =>
            typeof value === 'string' ? value : value?.nombre
          ),
          map((name: string) =>
            name ? this._filter(name) : this.formulas.slice()
          )
        );
      });
  }

  private _filter(name: string): IFormula[] {
    return this.formulas.filter(
      (formula: IFormula) =>
        formula.nombre.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }


  public ngOnDestroy(): void {
    this.form.reset();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  public displayFn(formula: IFormula): string {
    return formula && formula.nombre ? formula.nombre : '';
  }
  
  public search(): void {
    if (!this.form.controls.nroLote.value && !this.form.controls.idFormula.value &&
      !this.form.controls.fechaDesde.value && !this.form.controls.fechaHasta.value)
      this.lots$ = this.lotsBackUp$;

    if (this.form.controls.nroLote.value && this.form.controls.idFormula.value &&
        this.form.controls.fechaDesde.value && this.form.controls.fechaHasta.value)
      this.compare();
      
    if (this.form.controls.nroLote.value && !this.form.controls.idFormula.value &&
        !this.form.controls.fechaDesde.value && !this.form.controls.fechaHasta.value)
      this.compareLote();
            
    if (!this.form.controls.nroLote.value && this.form.controls.idFormula.value &&
        !this.form.controls.fechaDesde.value && !this.form.controls.fechaHasta.value)
      this.compareFormula();
                  
    if (!this.form.controls.nroLote.value && !this.form.controls.idFormula.value &&
       this.form.controls.fechaDesde.value && this.form.controls.fechaHasta.value)
      this.compareFecha();
  }
  
  private compare(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) =>
      lot.nroLote === this.form.controls.nroLote.value &&
      lot.idFormula === this.form.controls.idFormula.value &&
      lot.fecha >= this.form.controls.fechaDesde.value &&
      lot.fecha <= this.form.controls.fechaHasta.value
    );
  }
    
  private compareLote(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) =>
      lot.nroLote === this.form.controls.nroLote.value
    );
  }
    
  private compareFormula(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) =>
      lot.idFormula === this.form.controls.idFormula.value.id
    );
  }
    
  private compareFecha(): void {
    this.lots$ = this.lotsBackUp$.filter(
      (lot: ILot) => {
        var date2 = moment(lot.fecha,'DD/MM/YYYY');
        return date2 >= this.form.controls.fechaDesde.value &&
               date2 <= this.form.controls.fechaHasta.value
      }
    );
  }
}
