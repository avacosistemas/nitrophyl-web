import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
      client: [null, Validators.required],
      observations: [null],
      location: [null],
      piezaTipos: this._formBuilder.array([])
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
    this._clients.getClientes().subscribe({
      next: (res) => (this.clients$ = res.data),
      error: (err) => console.error(err),
      complete: () => { },
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
    if (this.moldeForm.invalid) return;

    let client: any = this.clients$.find((element: any) => {
      return element.id === this.moldeForm.controls.client.value;
    });

    const selectedTiposPieza = this.moldeForm.value.piezaTipos
      .map((checked, i) => checked ? { id: this.tiposPieza$[i].id } : null)
      .filter(v => v !== null);

    let model: Molde = {
      codigo: this.moldeForm.controls.code.value,
      estado: this.moldeForm.controls.estado.value,
      nombre: this.moldeForm.controls.name.value,
      observaciones: this.moldeForm.controls.observations.value,
      ubicacion: this.moldeForm.controls.location.value,
      idClienteDuenio: client ? client.id : null,
      clienteDuenio: client ? client.nombre : null,
      propio: client ? false : true,
      id: 0,
      piezaTipos: selectedTiposPieza
    };

    this.moldesService.postMolde(model).subscribe((res) => {
      if (res.status == 'OK') {
        this.moldesService.setMode('Edit');
        this.router.navigate([`/moldes/molde/editar/${res.data.id}`]);
        this.notificationService.showSuccess('Molde creado con exito.');
      } else {
        this.notificationService.showError('No se puedieron realizar los cambios.');
      }
    });
  }
}