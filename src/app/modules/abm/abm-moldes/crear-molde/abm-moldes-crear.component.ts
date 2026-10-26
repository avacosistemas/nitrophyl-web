import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Router } from '@angular/router';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { RemoveDialogComponent } from 'app/shared/components/remove/remove.component';
import { Molde } from 'app/modules/abm/abm-moldes/molde.model';
import { ClientesService } from 'app/modules/abm/abm-clientes/clientes.service';
import { ClienteCombo } from 'app/modules/abm/abm-clientes/cliente.model';
import { MoldesService } from 'app/modules/abm/abm-moldes/moldes.service';
import { Subscription, Observable, of } from 'rxjs';
import { debounceTime, switchMap, map, catchError, startWith, shareReplay } from 'rxjs/operators';
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
  public filteredClients$: Observable<ClienteCombo[]>;
  public tiposPieza$: { id: number; nombre: string }[] = [];
  public existingMoldCodes$: Observable<string[]>;

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
      code: [null, [Validators.required, Validators.maxLength(35)]],
      estado: ['ACTIVO', [Validators.required]],
      name: [null, [Validators.required, Validators.maxLength(100)]],
      cantidadBocas: [null, [Validators.required, Validators.min(1), Validators.pattern("^[0-9]*$")]],
      propio: [true, Validators.required],
      client: [{ value: null }],
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

    this.filteredClients$ = this.moldeForm.get('client')!.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      switchMap(value => this._clients.getClientesAutocomplete(typeof value === 'string' ? value : '').pipe(
        map(response => response.data || []),
        catchError(() => of([]))
      ))
    );

    this.existingMoldCodes$ = this.moldeForm.get('code')!.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      switchMap(value => {
        const code = typeof value === 'string' ? value.trim() : '';
        if (!code) return of([]);
        return this._abmPiezaService.getMoldesCombo(code).pipe(
          map(response => (response.data || [])
            .map(molde => molde.codigo || molde.nombre)
            .filter(existingCode => !!existingCode)),
          catchError(() => of([]))
        );
      }),
      shareReplay(1)
    );

    this.existingMoldCodes$.subscribe(existingCodes => {
      const codeControl = this.moldeForm.get('code');
      const enteredCode = (codeControl?.value || '').trim().toLowerCase();
      const duplicated = existingCodes.some(existingCode =>
        existingCode.trim().toLowerCase() === enteredCode
      );
      const errors = { ...(codeControl?.errors || {}) };
      if (duplicated) {
        errors.codigoExistente = true;
      } else {
        delete errors.codigoExistente;
      }
      codeControl?.setErrors(Object.keys(errors).length ? errors : null);
    });

    this._abmPiezaService.getPiezaTipo().subscribe({
      next: (tipos) => {
        this.tiposPieza$ = tipos;
        this.addTiposPiezaCheckboxes();
      },
      error: (err) => console.error(err)
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
    const selectedClient = this.moldeForm.get('client')?.value;
    if (!isPropio && (!selectedClient || typeof selectedClient === 'string')) {
      this.notificationService.showError('Por favor, seleccione un cliente de la lista.');
      return;
    }

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

    let model: Molde = {
      id: 0,
      codigo: this.moldeForm.get('code')?.value,
      estado: this.moldeForm.get('estado')?.value,
      nombre: this.moldeForm.get('name')?.value,
      observaciones: this.moldeForm.get('observations')?.value,
      ubicacion: this.moldeForm.get('location')?.value,
      cantidadBocas: this.moldeForm.get('cantidadBocas')?.value,
      piezaTipos: selectedTiposPieza,

      propio: isPropio,
      idClienteDuenio: isPropio ? null : selectedClient.id,
      clienteDuenio: isPropio ? null : selectedClient.nombre,

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

  displayClient(client: any): string {
    return client ? client.nombre || '' : '';
  }
}
