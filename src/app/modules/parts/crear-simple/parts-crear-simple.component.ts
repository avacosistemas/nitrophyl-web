import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Part } from 'app/shared/models/part.model';
import { PartsService } from 'app/shared/services/parts.service';
import { Subscription } from 'rxjs';
import { PartsEventService } from '../parts-event.service';

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
  showSuccess: boolean = false;
  showError: boolean = false;
  showErrorCode: boolean = false;
  showErrorName: boolean = false;
  mode: string = "";
  buttonAction: string = "";
  id: number = null;

  constructor(
    private _formBuilder: FormBuilder,
    private partsService: PartsService,
    private partsEventService: PartsEventService,
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
    this.buttonAction = "Guardar";
    this.mode = this.partsEventService.getMode();
    if(this.mode == null) {
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
      this.router.navigate([`/piezas/createComposed/${nav[nav.length - 1].id}`]);
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=>
      this.router.navigate([`/piezas/createComposed/${nav[nav.length - 1].id}`]));
    }
  }

  save() {
    this.showSuccess = false;
    this.showError = false;
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
        this.showSuccess = true;
      });
    } else {
      this.buttonAction = "Guardar";
      this.partsService.createSimplePart(model).subscribe(d => {
        this.id = d.data.id;
        this.showSuccess = true;
      });
      this.saved = true;
    }
  }

}
