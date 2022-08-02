import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Part } from 'app/shared/models/part.model';
import { PartsService } from 'app/shared/services/parts.service';
import { Subscription } from 'rxjs';
import { PartsEventService } from '../parts-event.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-parts-crear-simple',
  templateUrl: './parts-crear-simple.component.html',
  styleUrls: ['./parts-crear-simple.component.scss']
})
export class PartsCrearSimpleComponent implements OnInit, OnDestroy {

  component = "Pieza simple";
  parteSimpleForm: FormGroup;
  suscripcion: Subscription;
  saved: boolean = false;
  showErrorCode: boolean = false;
  showErrorName: boolean = false;
  mode: string = "";
  buttonAction: string = "";
  id: number = null;
  disableButton: boolean = true;

  constructor(
    private _formBuilder: FormBuilder,
    private partsService: PartsService,
    private partsEventService: PartsEventService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.parteSimpleForm = this._formBuilder.group({
      codigoPieza: ['', [Validators.required, Validators.maxLength(30)]],
      codigoInterno: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required]]
    });
    this.suscripcion = this.partsEventService.events.subscribe(
      (data: any) => {
        if (data == 4) {
          this.return();
        }
      }
    );
  }

  ngOnInit(): void {
    this.parteSimpleForm.valueChanges.subscribe(x => {
      this.disableButton = false;
    });
    this.buttonAction = "Guardar";
    this.mode = this.partsEventService.getMode();
    if (this.mode == null) {
      this.mode = "View";
    };
    this.inicializar();
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  inicializar() {
    if(this.route.snapshot.params.id != undefined) {
      this.id = this.route.snapshot.params.id;
      this.saved = true;
      this.partsEventService.viewEvents.next(5);
      this.partsService.getParts().subscribe(d => {
        let busqueda = d.data.find(pieza => pieza.id == this.id);
        this.parteSimpleForm.patchValue({
          codigoPieza: busqueda.codigoPieza,
          codigoInterno: busqueda.codigoInterno,
          nombre: busqueda.nombre
        });
        this.buttonAction = "Guardar";
      });
      if(this.mode == "View") {
        this.parteSimpleForm.disable();
      };
    } else {
      this.mode = "Create";
    }
  }

  return() {
    let nav = JSON.parse(localStorage.getItem("navPiezas"));
    if(nav == null) {
      this.router.navigate(['/piezas/grid']);
    } else if (nav.length == 0) {
      this.router.navigate(['/piezas/grid']);
    } else {
      this.router.navigateByUrl(`/${nav[nav.length - 1].uri}/createComposed/${nav[nav.length - 1].id}`);
    }
  }

  save() {
    this.parteSimpleForm.markAllAsTouched();
    if(!this.parteSimpleForm.valid) {
      return;
    };
    let model: Part = {
      codigoPieza: this.parteSimpleForm.controls.codigoPieza.value,
      codigoInterno: this.parteSimpleForm.controls.codigoInterno.value,
      nombre: this.parteSimpleForm.controls.nombre.value,
      esProducto: false,
      id: 0,
      piezas: [],
      tipo: "SIMPLE"
    };
    if (this.saved == true) {
      this.partsService.updateSimplePart(model, this.id).subscribe(d => {
        this.openSnackBar("Cambios realizados", "X", "green-snackbar");
        this.disableButton = true;
      },
      err => {
        this.openSnackBar("No se pudieron realizar los cambios", "X", "red-snackbar");
        console.log(err.error.message);
        //this.openErrorSnackBar(err.error.message, "X");
      });
    } else {
      this.buttonAction = "Guardar";
      this.partsService.createSimplePart(model).subscribe(d => {
        this.id = d.data.id;
        this.openSnackBar("Cambios realizados", "X", "green-snackbar");
        this.disableButton = true;
        this.partsEventService.viewEvents.next(5);
      },
      err => {
        this.openSnackBar("No se pudieron realizar los cambios", "X", "red-snackbar");
        console.log(err.error.message);
        //this.openErrorSnackBar(err.error.message, "X");
      });
      this.saved = true;
    }
  }

  openSnackBar(message: string, action: string, className: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: className
    });
  };

}
