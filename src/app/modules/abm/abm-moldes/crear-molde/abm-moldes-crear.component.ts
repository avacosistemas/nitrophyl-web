import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Router } from '@angular/router';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { RemoveDialogComponent } from 'app/shared/components/remove/remove.component';
import { Molde } from 'app/modules/abm/abm-moldes/molde.model';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { MoldesService } from 'app/modules/abm/abm-moldes/moldes.service';
import { Subscription, Observable, of } from 'rxjs';
import { debounceTime, switchMap, map, catchError, startWith } from 'rxjs/operators';
import { ABMMoldeService } from '../abm-moldes.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'abm-moldes-crear',
  templateUrl: './abm-moldes-crear.component.html',
})
export class ABMMoldesCrear implements OnInit, OnDestroy {
  component: string = 'Create';
  suscripcion: Subscription;
  moldeForm: FormGroup;
  public clients$: any = [];
  public tiposPieza$: { id: number; nombre: string }[] = [];
  public filteredTroqueles$: Observable<any[]> = of([]);

  private requireAtLeastOneCheckbox(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const checkboxes = formArray as FormArray;
      const hasAtLeastOne = checkboxes.controls.some(control => control.value === true);
      return hasAtLeastOne ? null : { requireAtLeastOne: true };
    };
  }

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private moldesService: MoldesService,
    private _formBuilder: FormBuilder,
    private ABMoldesService: ABMMoldeService,
    private _clients: ClientesService,
    private _abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
  ) {
    this.moldeForm = this._formBuilder.group({
      code: [null, [Validators.required, Validators.maxLength(30)]],
      estado: ['ACTIVO', [Validators.required]],
      name: [null, [Validators.required, Validators.maxLength(100)]],
      cantidadBocas: [null, [Validators.required, Validators.min(1), Validators.pattern("^[0-9]*$")]],
      propio: [true, Validators.required],
      client: [{ value: null }],
      troquel: [null, [Validators.maxLength(20)]],
      observations: [null],
      location: [null],
      piezaTipos: this._formBuilder.array([], this.requireAtLeastOneCheckbox()),

      tipoMolde: ['RECTANGULAR', Validators.required],
      alto: [null, [Validators.pattern('^[0-9]*\\.?[0-9]+$')]],
      ancho: [null, [Validators.pattern('^[0-9]*\\.?[0-9]+$')]],
      profundidad: [null, [Validators.pattern('^[0-9]*\\.?[0-9]+$')]],
      diametro: [null, [Validators.pattern('^[0-9]*\\.?[0-9]+$')]]
    });

    this.moldeForm.get('tipoMolde')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.updateDimensionValidators(tipo);
      }
    });

    this.moldeForm.get('propio')?.valueChanges.subscribe(isPropio => {
      const clientControl = this.moldeForm.get('client');
      if (clientControl) {
        if (isPropio) {
          clientControl.clearValidators();
          clientControl.setValue(null);
        } else {
          clientControl.setValidators(Validators.required);
        }
        clientControl.updateValueAndValidity();
      }
    });

    this.suscripcion = this.ABMoldesService.events.subscribe((data: any) => {
      if (data == 1) {
        this.close();
      } else if (data == 4) {
        this.create();
      }
    });
  }

  ngOnInit(): void {
    this.updateDimensionValidators('RECTANGULAR');

    this._clients.getClientes().subscribe({
      next: (res) => {
        this.clients$ = res.data;
      },
      error: (err) => console.error(err),
    });

    this._abmPiezaService.getPiezaTipo().subscribe({
      next: (tipos) => {
        this.tiposPieza$ = tipos;
        this.addTiposPiezaCheckboxes();
      },
      error: (err) => console.error(err)
    });

    this.filteredTroqueles$ = (this.moldeForm.get('troquel')?.valueChanges || of('')).pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const searchTerm = typeof value === 'string' ? value : (value?.nombre || '');
        return this.moldesService.buscarTroqueles(searchTerm).pipe(
          map(res => res?.data || []),
          catchError(() => of([]))
        );
      })
    );
  }

  displayTroquel(item: any): string {
    if (!item) return '';
    return typeof item === 'string' ? item : (item.nombre || '');
  }

  clearTroquelSelection(): void {
    this.moldeForm.get('troquel')?.setValue(null);
  }

  getTroquelSearchTerm(): string {
    const value = this.moldeForm.get('troquel')?.value;
    if (!value) return '';
    return (typeof value === 'string' ? value : (value?.nombre || '')).trim();
  }

  isTroquelExactMatch(troqueles: any[] | null): boolean {
    const term = this.getTroquelSearchTerm().toLowerCase();
    if (!term || !troqueles) return false;
    return troqueles.some(t => {
      const name = (typeof t === 'string' ? t : (t?.nombre || '')).toLowerCase();
      return name === term;
    });
  }

  private addTiposPiezaCheckboxes(): void {
    const piezaTiposFormArray = this.moldeForm.get('piezaTipos') as FormArray;
    if (piezaTiposFormArray) {
      this.tiposPieza$.forEach(() => piezaTiposFormArray.push(new FormControl(false)));
    }
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  ngAfterViewInit() {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  updateDimensionValidators(tipoMolde: string) {
    const anchoCtrl = this.moldeForm.get('ancho');
    const profCtrl = this.moldeForm.get('profundidad');
    const diametroCtrl = this.moldeForm.get('diametro');

    if (!anchoCtrl || !profCtrl || !diametroCtrl) return;

    anchoCtrl.clearValidators();
    profCtrl.clearValidators();
    diametroCtrl.clearValidators();

    const numberPattern = Validators.pattern('^[0-9]*\\.?[0-9]+$');

    if (tipoMolde === 'RECTANGULAR') {
      anchoCtrl.setValidators([numberPattern]);
      profCtrl.setValidators([numberPattern]);
      diametroCtrl.setValidators([numberPattern]);
      diametroCtrl.setValue(null);
    } else {
      diametroCtrl.setValidators([numberPattern]);
      anchoCtrl.setValidators([numberPattern]);
      profCtrl.setValidators([numberPattern]);
      anchoCtrl.setValue(null);
      profCtrl.setValue(null);
    }

    anchoCtrl.updateValueAndValidity();
    profCtrl.updateValueAndValidity();
    diametroCtrl.updateValueAndValidity();
  }

  close() {
    if (this.moldeForm.pristine == true) {
      this.router.navigate(['/moldes/grid']);
    } else {
      const dialogRef = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '50%',
        data: { data: null, seccion: 'molde', boton: 'Cerrar' },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.router.navigate(['/moldes/grid']);
        }
      });
    }
  }

  public create(): void {
    this.moldeForm.markAllAsTouched();

    if (this.moldeForm.invalid) {
      const piezaTiposControl = this.moldeForm.get('piezaTipos');
      if (piezaTiposControl?.hasError('requireAtLeastOne')) {
        this.notificationService.showError('Debe seleccionar al menos un tipo de pieza.');
      } else {
        this.notificationService.showError('Por favor, complete todos los campos requeridos.');
      }
      return;
    }

    const isPropio = this.moldeForm.get('propio')?.value;

    const selectedClientId = this.moldeForm.get('client')?.value;
    const selectedClient = this.clients$.find((element: any) => element.id === selectedClientId);

    const selectedTiposPieza = (this.moldeForm.value.piezaTipos || [])
      .map((checked: boolean, i: number) => checked ? {
        id: this.tiposPieza$[i].id,
        nombre: this.tiposPieza$[i].nombre
      } : null)
      .filter((v: any) => v !== null);

    const tipoMolde = this.moldeForm.get('tipoMolde')?.value;
    const alto = this.moldeForm.get('alto')?.value;
    let ancho = 0;
    let profundidad = 0;
    let diametro = 0;

    if (tipoMolde === 'RECTANGULAR') {
      ancho = this.moldeForm.get('ancho')?.value;
      profundidad = this.moldeForm.get('profundidad')?.value;
    } else {
      diametro = this.moldeForm.get('diametro')?.value;
    }

    const troquelVal = this.moldeForm.get('troquel')?.value;
    let troquelNombre: string | null = null;
    let idTroquel: number | null = null;
    if (typeof troquelVal === 'string') {
      troquelNombre = troquelVal.trim() || null;
    } else if (troquelVal && typeof troquelVal === 'object') {
      troquelNombre = troquelVal.nombre || null;
      idTroquel = troquelVal.id || null;
    }

    let model: Molde = {
      id: 0,
      codigo: this.moldeForm.get('code')?.value,
      estado: this.moldeForm.get('estado')?.value,
      nombre: this.moldeForm.get('name')?.value,
      observaciones: this.moldeForm.get('observations')?.value,
      ubicacion: this.moldeForm.get('location')?.value,
      cantidadBocas: this.moldeForm.get('cantidadBocas')?.value,
      troquel: troquelNombre,
      idTroquel: idTroquel,
      piezaTipos: selectedTiposPieza,

      propio: isPropio,
      idClienteDuenio: selectedClient?.id || null,
      clienteDuenio: selectedClient?.nombre || null,

      tipoMolde: tipoMolde,
      alto: alto,
      ancho: ancho,
      profundidad: profundidad,
      diametro: diametro
    };

    this.moldesService.postMolde(model).subscribe({
      next: (res) => {
        if (res.status == 'OK') {
          this.moldesService.setMode('Edit');
          this.router.navigate([`/moldes/molde/editar/${res.data.id}`]);
          this.notificationService.showSuccess('Molde creado con éxito.');
        } else {
          this.notificationService.showError(res.message || 'No se pudieron realizar los cambios.');
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.error && error.error.status === 'ERROR' && error.error.error === 'ErrorValidationException') {
          this.notificationService.showError(error.error.data);
        } else {
          this.notificationService.showError('Ocurrió un error inesperado.');
        }
        console.error(error);
      }
    });
  }
}