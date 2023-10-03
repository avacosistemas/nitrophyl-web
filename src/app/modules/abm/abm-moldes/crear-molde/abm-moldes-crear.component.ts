import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { Molde } from 'app/shared/models/molde.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { MoldesService } from 'app/shared/services/moldes.service';
import { Subscription } from 'rxjs';
import { ABMMoldeService } from '../abm-moldes-service';

@Component({
  selector: 'abm-moldes-crear',
  templateUrl: './abm-moldes-crear.component.html',
})
export class ABMMoldesCrear implements OnInit, OnDestroy {
  component: string = 'Create';
  suscripcion: Subscription;
  moldeForm: FormGroup;
  public clients$: any = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private router: Router,
    private moldesService: MoldesService,
    private _formBuilder: FormBuilder,
    private ABMoldesService: ABMMoldeService,
    private _clients: ClientesService,
    private snackBar: MatSnackBar
  ) {
    this.moldeForm = this._formBuilder.group({
      code: [null, [Validators.required, Validators.maxLength(30)]],
      status: ['ACTIVO', [Validators.required]],
      name: [null, [Validators.required, Validators.maxLength(100)]],
      client: [null, Validators.required],
      observations: [null],
      location: [null],
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
      complete: () => {},
    });
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

  create() {
    if (this.moldeForm.invalid) return;

    let client: any;

    this.moldeForm.controls.client.value !== 0
      ? (client = this.clients$.find((element: any) => {
          return element.id === this.moldeForm.controls.client.value;
        }))
      : (client = { id: 0, nombre: 'Nitro-Phyl' });

    let model: Molde = {
      codigo: this.moldeForm.controls.code.value,
      estado: this.moldeForm.controls.status.value,
      nombre: this.moldeForm.controls.name.value,
      observaciones: this.moldeForm.controls.observations.value,
      ubicacion: this.moldeForm.controls.location.value,
      idClienteDuenio: client.id,
      clienteDuenio: client.nombre,
      propio: client.id === 0,
      id: 0,
    };

    this.moldesService.postMolde(model).subscribe((res) => {
      if (res.status == 'OK') {
        this.moldesService.setMode('Edit');
        this.router.navigate([`/moldes/molde/${res.data.id}`]);
        this.openSnackBar('Molde creado con exito', 'X', 'green-snackbar');
      } else {
        this.openSnackBar(
          'No se puedieron realizar los cambios',
          'X',
          'red-snackbar'
        );
      }
    });
  }

  private openSnackBar(
    message: string,
    action: string,
    className: string
  ): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: className,
    });
  }
}
