import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, Subscription } from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';

// * Interfaces.
import {
  IAssay,
  IAssayCreate,
  IAssayResponse,
  IAssaysResponse,
} from 'app/shared/models/assay.interface';
import { IConfigTest, IParams } from 'app/shared/models/config-test.interface';
interface Icon {
  color: string;
  icon: string;
  tooltip?: string;
}

// * Material.
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Components.
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

@Component({
  selector: 'app-assays',
  templateUrl: './assays.component.html',
})
export class AssaysComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public drawer: boolean; // Drawer state.

  public assays$: Observable<IAssay[]>; // Assays list.
  // * Table assays.
  public displayedColumnsAssays: string[] = [
    'maquina',
    'fecha',
    'resultados',
    'observaciones',
    'actions',
  ];

  // * Form assay (drawer).
  public form: FormGroup;
  public paramsArray: AbstractControl[];

  // * Table assay (drawer).
  public assay: IConfigTest;
  public displayedColumnsAssay: string[] = [
    'nombre',
    'minimo',
    'maximo',
    'resultado',
    'redondeo',
    'estado',
  ];

  private icons: { [key: string]: Icon } = {
    green: { color: 'green', icon: 'check_circle' },
    yellow: { color: 'yellow', icon: 'warning' },
    red: { color: 'red', icon: 'error' },
    help: { color: 'grey', icon: 'help', tooltip: 'datos inválidos' },
  };
  private machine: number;
  private subscription: Subscription; // Drawer subscription.

  constructor(
    private assayService: AssayService,
    private configTestService: ConfigTestService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  public ngOnInit(): void {
    // if (!this.assayService.lot.id) {
    //   this.router.navigate(['../../lotes/grid']);
    //   return;
    // }

    this.assays$ = this.assayService
      .get(this.assayService?.lot?.id)
      .pipe(
        map((res: IAssaysResponse | IAssayResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      );

    this.subscription = this.assayService.drawer$.subscribe(
      (drawer: boolean) => {
        if (drawer) {
          this.machine = this.assayService.machine;
          this._get();
        }
        this.drawer = drawer;
      }
    );

    this.form = this.formBuilder.group({
      observation: new FormControl(null, Validators.maxLength(255)),
      params: this.formBuilder.array([]),
    });
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public icon(element: AbstractControl): Icon {
    const min: number | null = element.get('minimo')?.value;
    const max: number | null = element.get('maximo')?.value;
    const result: number | null = element.get('resultado')?.value;
    const round: number | null = element.get('redondeo')?.value;

    if (this._range(round, min, max) && round === result) {
      return this.icons.green;
    } else if (this._range(round, min, max) && round !== result) {
      return this.icons.yellow;
    } else if (!this._range(round, min, max) && round === result) {
      return this.icons.red;
    }
    return this.icons.help;
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const assay: IAssayCreate = {
      idConfiguracionPrueba: this.machine,
      observaciones: this.form.get('observation')?.value ?? '',
      resultados: this.form
        .get('params')
        .value.map((param: IParams, index: number) => ({
          idConfiguracionPruebaParametro: Number(
            this.assay.parametros[index].id
          ),
          redondeo: Number(param.redondeo),
          resultado: Number(param.resultado),
        })),
    };

    this._post(assay);
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

  private _get(): void {
    const error: string = 'abm-assays => assays.component.ts => _get() =>';
    this.configTestService.getId(this.machine).subscribe({
      next: (res: any) => {
        this.assay = res.data;
        const formGroups = [];
        for (const param of this.assay.parametros) {
          const group = this.formBuilder.group({
            nombre: [param.nombre],
            minimo: [param.minimo],
            maximo: [param.maximo],
            resultado: [
              '',
              [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)],
            ],
            redondeo: [
              '',
              [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)],
            ],
          });
          group.get('resultado').valueChanges.subscribe((value) => {
            group.get('redondeo').setValue(value, { emitEvent: false });
          });
          formGroups.push(group);
        }
        this.form.setControl('params', this.formBuilder.array(formGroups));
        this.paramsArray = (this.form.get('params') as FormArray).controls;
      },
      error: (err: any) => console.error(error, err),
    });
  }

  private _post(assay: IAssayCreate): void {
    const error: string = 'abm-lots => lots.component.ts => _post() =>';
    this.assayService.post(assay).subscribe({
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
    this.assayService.toggleDrawer();
  }

  private _range(value: number, min: number, max: number): boolean {
    return (min === null || value >= min) && (max === null || value <= max);
  }
}
