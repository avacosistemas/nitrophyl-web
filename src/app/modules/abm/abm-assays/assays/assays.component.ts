import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { map, Observable, Subscription } from 'rxjs';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';

// * Interfaces.
import {
  IAssay,
  IAssayCreate,
  IAssayDetail,
  IAssayDetailResponse,
  IAssayDetailsResponse,
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
import { ActivatedRoute } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

// * Dialogs.
import { DatePipe } from '@angular/common';
import { AssayDialogComponent } from '../assay-dialog/assay-dialog.component';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-assays',
  templateUrl: './assays.component.html',
})
export class AssaysComponent implements OnInit, AfterViewInit, OnDestroy {
  public component: string = 'all';
  public mode: string; // Mode: 'create' or 'view'.
  public title: string;
  public drawer: boolean;

  public assays$: Observable<IAssay[]>;
  // * Table assays.
  public displayedColumnsAssays: string[] = [
    'resultados',
    'maquina',
    'fecha',
    'observaciones',
    'actions',
  ];

  // * Form assay (drawer).
  public form: FormGroup;
  public paramsArray: AbstractControl[];

  // * Table assay (drawer).
  public assay: IConfigTest;
  public assay$: Observable<IAssayDetail[]>;
  public displayedColumnsAssay: string[] = [
    'nombre',
    'minimo',
    'maximo',
    'resultado',
    'redondeo',
    'estado',
  ];

  public assayObservations: string;

  private icons: { [key: string]: Icon } = {
    green: { color: 'green', icon: 'check_circle' },
    yellow: { color: 'yellow', icon: 'warning' },
    red: { color: 'red', icon: 'error' },
    help: { color: 'grey', icon: 'help', tooltip: 'datos inválidos' },
  };
  private machine: number;
  private lot: number;
  private subscription: Subscription;
  private selectedAssayId: number;
  private selectedAssayName: string;

  constructor(
    private assayService: AssayService,
    private configTestService: ConfigTestService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private _dPipe: DatePipe,
    private dateAdapter: DateAdapter<Date>
  ) { this.dateAdapter.setLocale('es');}

  public ngOnInit(): void {
    this.route.params.subscribe((params: { id: number }) => {
      this.lot = params?.id;
    });

    if (!this.assayService.lot?.id || !this.lot) {
      return;
    }

    this.subscription = this.assayService.drawer$.subscribe(
      (drawer: boolean) => {
        this.mode = this.assayService.mode;
        if (drawer) {
          if (this.mode === 'create') {
            this.title = 'Nuevo ensayo';
            this.machine = this.assayService.machine;
            this._get();
            this.form = this.formBuilder.group({
              fecha: new FormControl(new Date(), Validators.required),
              params: this.formBuilder.array([]),
            });
          }
          if (this.mode === 'view') {
            this.assay$ = this.assayService
              .getAssay(this.machine)
              .pipe(
                map((res: IAssayDetailResponse | IAssayDetailsResponse) =>
                  Array.isArray(res.data) ? res.data : [res.data]
                )
              );
          }
          if (this.mode === 'edit') {
            this.title = 'Editar ensayo ' + this.selectedAssayName;
            this._getAssayForEdit(this.selectedAssayId);
          }
        }
        this.drawer = drawer;
      }
    );

    this.assays$ = this.assayService
      .get(this.lot)
      .pipe(
        map((res: IAssaysResponse | IAssayResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      );

      this.assays$ = this.assayService.assays$;
      this.assayService.fetchAssays(this.assayService.lot.id);
  }

  public ngAfterViewInit(): void {
    const top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
    }
  }

  public icon(element: AbstractControl | IAssayDetail): Icon {
    let min: number | null;
    let max: number | null;
    let result: number | null;
    let round: number | null;

    if (element instanceof AbstractControl) {
      min = element.get('minimo')?.value;
      max = element.get('maximo')?.value;
      result = element.get('resultado')?.value;
      round = element.get('redondeo')?.value;
    } else {
      min = element.minimo;
      max = element.maximo;
      result = element.resultado;
      round = element.redondeo;
    }

    if (this._range(round, min, max) && round === result) {
      return this.icons.green;
    } else if (this._range(round, min, max) && round !== result) {
      return this.icons.yellow;
    } else if (!this._range(round, min, max) && round === result) {
      return this.icons.red;
    }
    return this.icons.help;
  }

  public view(assay: IAssay): void {
    this.machine = assay.id;
    this.title = assay?.maquina;
    this.assayObservations = assay?.observaciones;

    this.assayService.mode = 'view';
    this.assayService.toggleDrawer();
    this.assay$ = this.assayService
      .getAssay(this.machine)
      .pipe(
        map((res: IAssayDetailResponse | IAssayDetailsResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      );
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let failed: boolean = false;

    const date: string = this._dPipe.transform(
      this.form.controls['fecha'].value,
      'dd/MM/yyyy'
    );

    const assay: IAssayCreate = {
      idLote: this.lot,
      idConfiguracionPrueba: this.machine,
      fecha: date,
      observaciones: '',
      estado: '',
      resultados: this.form
        .get('params')
        .value.map((param: IParams, index: number) => {
          if (
            (param.minimo === null || param.redondeo < param.minimo) &&
            (param.maximo === null || param.redondeo > param.maximo) &&
            param.resultado !== null &&
            param.redondeo !== param.resultado
          ) {
            this._snackBar(false, param.maquinaPrueba.nombre);
            failed = true;
            return;
          }
          return {
            idConfiguracionPruebaParametro: Number(
              this.assay.parametros[index].id
            ),
            redondeo: Number(param.redondeo),
            resultado: Number(param.resultado),
            //nombre: param.maquinaPrueba.nombre,
            nombre: param.nombre,
            maximo: Number(param.maximo),
            minimo: Number(param.minimo),
          };
        }),
    };

    if (!failed) {
      this._dialog(assay);
    }
  }

  public close(): void {
    if (this.mode === 'create') {
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
    } else {
      this._reset();
    }
  }

  public ngOnDestroy(): void {
    if (this.mode === 'create' && this.form) {
      this.form.reset();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public edit(assay: IAssay): void {
    this.selectedAssayId = assay.id;
    this.machine = assay.id;
    this.selectedAssayName = assay.maquina;
    this.title = 'Editar ' + assay?.maquina;
    this.assayObservations = assay?.observaciones;

    this.assayService.mode = 'edit';
    this.assayService.toggleDrawer();
  }

  private _parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    }
    return new Date();
  }

  public update(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let failed: boolean = false;

    const date: string = this._dPipe.transform(
      this.form.controls['fecha'].value,
      'yyyy-MM-dd'
    );

    this.assayService.get(this.lot).subscribe({
      next: (assayRes: IAssaysResponse | IAssayResponse) => {
        const assayData = Array.isArray(assayRes.data) ? assayRes.data : [assayRes.data];

        const selectedAssay = assayData.find(assay => assay.id === this.selectedAssayId);

        if (!selectedAssay) {
          console.error('Assay not found for ID:', this.selectedAssayId);
          this._snackBar(false, 'Ensayo no encontrado');
          return;
        }
        const ensayoDTO: any = { 
          id: this.selectedAssayId,
          idLote: Number(this.lot),
          idConfiguracionPrueba: selectedAssay.idConfiguracionPrueba,
          fecha: date,
          observaciones: this.form.get('observaciones')?.value || '',
          estado: '',
          maquina: this.selectedAssayName,
          resultados: this.form
            .get('params')
            .value.map((param: any) => {
              if (
                (param.minimo === null || param.redondeo < param.minimo) &&
                (param.maximo === null || param.redondeo > param.maximo) &&
                param.resultado !== null &&
                param.redondeo !== param.resultado
              ) {
                this._snackBar(false, param.nombre);
                failed = true;
                return;
              }

              return {
                id: param.id,
                idEnsayo: param.idEnsayo,
                idConfiguracionPruebaParametro: param.idConfiguracionPruebaParametro,
                nombre: param.nombre,
                minimo: param.minimo,
                maximo: param.maximo,
                resultado: Number(param.resultado),
                redondeo: Number(param.redondeo),
                norma: param.norma
              };
            }).filter(result => result !== undefined),
        };

        if (!failed) {
          this._dialogUpdate(ensayoDTO);
        }
      },
      error: (err: any) => {
        console.error('update() =>', err);
        this._snackBar(false, 'Error al cargar la información del ensayo');
      }
    });
  }

  private _dialogUpdate(ensayoDTO: any): void { 
    const dialogRef = this.dialog.open(AssayDialogComponent, {
      width: 'fit-content',
      data: { isUpdate: true }
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { status: string; observation: string }) => {
        if (result) {
          ensayoDTO.estado = result.status;
          ensayoDTO.observaciones = result.observation;
          this._updateAssay(ensayoDTO);
        }
      });
  }

  private _updateAssay(ensayoDTO: any): void {
    const error: string = 'abm-lots => lots.component.ts => _update() =>';

    this.assayService.update(ensayoDTO).subscribe({
      next: () => {
        this._snackBar(true);
        this._reset();

        this.assayService.fetchAssays(this.assayService.lot.id);
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false);
      },
    });
  }

  private _getAssayForEdit(assayId: number): void {
    const error: string = 'abm-assays => assays.component.ts => _getAssayForEdit() =>';

    this.form = this.formBuilder.group({
      fecha: [null, Validators.required],
      params: this.formBuilder.array([]),
      observaciones: ['']
    });

    this.assayService.get(this.lot).subscribe({
        next: (assayRes: IAssaysResponse | IAssayResponse) => {
          const assayData = Array.isArray(assayRes.data) ? assayRes.data : [assayRes.data];

          const selectedAssay = assayData.find(assay => assay.id === assayId);

          if (!selectedAssay) {
            console.error('Assay not found for ID:', assayId);
            this._snackBar(false, 'Ensayo no encontrado');
            return;
          }

          this.form.controls['fecha'].setValue(this._parseDate(selectedAssay.fecha));
          this.form.controls['observaciones'].setValue(selectedAssay.observaciones);

          this.assayService.getAssay(assayId).subscribe({
            next: (assayDetailsRes: IAssayDetailResponse | IAssayDetailsResponse) => {
              const assayDetails = Array.isArray(assayDetailsRes.data) ? assayDetailsRes.data : [assayDetailsRes.data];

              const formGroups = assayDetails.map(detail => {
                const group = this.formBuilder.group({
                  id: [detail.id],
                  idEnsayo: [detail.idEnsayo],
                  idConfiguracionPruebaParametro: [detail.idConfiguracionPruebaParametro],
                  nombre: [detail.nombre],
                  minimo: [detail.minimo],
                  maximo: [detail.maximo],
                  resultado: [
                    detail.resultado,
                    [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)]
                  ],
                  redondeo: [
                    detail.redondeo,
                    [Validators.required, Validators.pattern(/^\d+(\.\d{1,4})?$/)]
                  ],
                  norma:[detail.norma]
                });

                group.get('resultado').valueChanges.subscribe((value) => {
                  group.get('redondeo').setValue(value, { emitEvent: false });
                });

                return group;
              });

              (this.form.get('params') as FormArray).clear();

              formGroups.forEach(group => {
                (this.form.get('params') as FormArray).push(group);
              });

              this.paramsArray = (this.form.get('params') as FormArray).controls;
            },
            error: (err: any) => {
              console.error(error, err);
              this._snackBar(false, 'Error al cargar los detalles del ensayo');
            }
          });
        },
        error: (err: any) => {
          console.error(error, err);
          this._snackBar(false, 'Error al cargar la información del ensayo');
        }
      });
  }

  private _get(): void {
    const error: string = 'abm-assays => assays.component.ts => _get() =>';
    this.configTestService.getId(this.machine).subscribe({
      next: (res: any) => {
        this.assay = res.data;
        const formGroups = [];
        for (const param of this.assay.parametros) {
          const group = this.formBuilder.group({
            nombre: [param.maquinaPrueba.nombre],
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
        this.assays$ = this.assayService
          .get(this.lot)
          .pipe(
            map((res: IAssaysResponse | IAssayResponse) =>
              Array.isArray(res.data) ? res.data : [res.data]
            )
          );
      },
      error: (err: any) => {
        console.log(error, err);
        this._snackBar(false);
      },
    });
  }

  private _snackBar(option?: boolean, test?: string): void {
    let message: string = option
      ? 'Cambios realizados correctamente.'
      : 'No se han podido realizar los cambios.';

    const css: string = option ? 'green' : 'red';

    if (test) {
      message = 'Datos inválidos en la prueba: ' + test;
    }

    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }

  private _reset(): void {
    if (this.mode === 'create' || this.mode === 'edit') {
      this.form.reset();
      (this.form.get('params') as FormArray).clear();
    }
    this.assayService.toggleDrawer();
  }

  private _range(value: number, min: number, max: number): boolean {
    return (min === null || value >= min) && (max === null || value <= max);
  }

  private _dialog(assay: IAssayCreate): void {
    const dialogRef = this.dialog.open(AssayDialogComponent, {
      width: 'fit-content',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { status: string; observation: string }) => {
        if (result) {
          assay.estado = result.status;
          assay.observaciones = result.observation;
          this._post(assay);
        }
      });
  }
}