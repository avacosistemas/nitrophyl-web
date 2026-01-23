import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { Molde } from 'app/shared/models/molde.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { MoldesService } from 'app/shared/services/moldes.service';
import { Subscription } from 'rxjs';
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

  private requireAtLeastOneCheckbox(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const checkboxes = formArray as FormArray;
      const hasAtLeastOne = checkboxes.controls.some(control => control.value === true);
      return hasAtLeastOne ? null : { requireAtLeastOne: true };
    };
  }

  constructor(
    private activatedRoute: ActivatedRoute,
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
      client: [null],
      observations: [null],
      location: [null],
      piezaTipos: this._formBuilder.array([], this.requireAtLeastOneCheckbox()),
      
      tipoMolde: ['RECTANGULAR', Validators.required],
      alto: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      ancho: [null, [Validators.pattern("^[0-9]*$")]],
      profundidad: [null, [Validators.pattern("^[0-9]*$")]],
      diametro: [null, [Validators.pattern("^[0-9]*$")]]
    });

    this.moldeForm.get('tipoMolde').valueChanges.subscribe(tipo => {
      this.updateDimensionValidators(tipo);
    });

    this.moldeForm.get('propio').valueChanges.subscribe(isPropio => {
      const clientControl = this.moldeForm.get('client');
      if (isPropio) {
        clientControl.clearValidators();
        clientControl.setValue(null);
      } else {
        clientControl.setValidators(Validators.required);
      }
      clientControl.updateValueAndValidity();
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
  }

  private addTiposPiezaCheckboxes(): void {
    const piezaTiposFormArray = this.moldeForm.get('piezaTipos') as FormArray;
    this.tiposPieza$.forEach(() => piezaTiposFormArray.push(new FormControl(false)));
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
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

    anchoCtrl.clearValidators();
    profCtrl.clearValidators();
    diametroCtrl.clearValidators();
    
    const numberPattern = Validators.pattern("^[0-9]*$");

    if (tipoMolde === 'RECTANGULAR') {
      anchoCtrl.setValidators([Validators.required, numberPattern]);
      profCtrl.setValidators([Validators.required, numberPattern]);
      diametroCtrl.setValidators([numberPattern]);
      diametroCtrl.setValue(null);
    } else { 
      diametroCtrl.setValidators([Validators.required, numberPattern]);
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

    const isPropio = this.moldeForm.get('propio').value;
    let selectedClient = null;

    if (!isPropio) {
      const selectedClientId = this.moldeForm.controls.client.value;
      selectedClient = this.clients$.find((element: any) => element.id === selectedClientId);
    }

    const selectedTiposPieza = this.moldeForm.value.piezaTipos
      .map((checked, i) => checked ? {
        id: this.tiposPieza$[i].id,
        nombre: this.tiposPieza$[i].nombre
      } : null)
      .filter(v => v !== null);

    const tipoMolde = this.moldeForm.get('tipoMolde').value;
    const alto = this.moldeForm.get('alto').value;
    let ancho = 0;
    let profundidad = 0;
    let diametro = 0;

    if (tipoMolde === 'RECTANGULAR') {
      ancho = this.moldeForm.get('ancho').value;
      profundidad = this.moldeForm.get('profundidad').value;
    } else {
      diametro = this.moldeForm.get('diametro').value;
    }

    let model: Molde = {
      id: 0,
      codigo: this.moldeForm.controls.code.value,
      estado: this.moldeForm.controls.estado.value,
      nombre: this.moldeForm.controls.name.value,
      observaciones: this.moldeForm.controls.observations.value,
      ubicacion: this.moldeForm.controls.location.value,
      cantidadBocas: this.moldeForm.controls.cantidadBocas.value,
      piezaTipos: selectedTiposPieza,

      propio: isPropio,
      idClienteDuenio: isPropio ? null : (selectedClient ? selectedClient.id : null),
      clienteDuenio: isPropio ? null : (selectedClient ? selectedClient.nombre : null),

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