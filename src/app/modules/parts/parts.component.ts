import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PartsService } from 'app/shared/services/parts.service';
import { Subscription } from 'rxjs';
import { PartsEventService } from './parts-event.service';

@Component({
  selector: 'app-parts',
  templateUrl: './parts.component.html',
  styleUrls: ['./parts.component.scss']
})
export class PartsComponent implements OnInit, AfterContentChecked, OnDestroy {

  titulo: string = '';
  tituloNav: string = "Listado";
  suscripcion: Subscription;
  botonEdicion: string = '';

  constructor(
    private partsService: PartsService,
    private partsEventService: PartsEventService,
    private router: Router,
    private cdref: ChangeDetectorRef
  ) {
    this.suscripcion = this.partsEventService.viewEvents.subscribe(
      (data: any) => {
        /*
        0 - Guardar pieza simple
        1 - Guardar pieza compuesta
        2 - Nueva pieza simple
        3 - Nueva pieza compuesta
        4 - Volver
        5 - Modificar pieza simple
        6 - Modificar pieza compuesta
        7 - Modificar producto simple
        8 - Modificar producto compuesto
        */
          if (data == 0) {
            //Guardar pieza simple
          } else if (data == 1) {
            //Guardar pieza compuesta
          } else if (data == 2) {
            //Nueva pieza simple
          } else if (data == 3) {
            //Nueva pieza compuesta
          } else if (data == 4) {
            //Volver
          } else if (data == 5) {
            //Modificar pieza simple
            this.titulo = "Modificar pieza simple"
          } else if (data == 6) {
            //Modificar pieza compuesta
            this.titulo = "Modificar pieza compuesta"
          } else if (data == 7) {
            //Modificar producto simple
            this.titulo = "Modificar producto simple"
          } else if (data == 8) {
            //Modificar producto compuesto
            this.titulo = "Modificar producto compuesto"
          }
      }
  )
  }

  ngOnInit(): void {
    this.botonEdicion = "";
  }

  ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }


  componentAdded(event) {
    if (event.component == "Grilla") {
        this.titulo = "Consulta Piezas";
        this.tituloNav = "Listado"
    }
    if (event.component == "Pieza simple") {
      this.titulo = "Nueva pieza simple";
      this.tituloNav = "Pieza simple"
    }
    if (event.component == "Pieza compuesta") {
        this.titulo = "Nueva pieza compuesta";
        this.tituloNav = "Pieza compuesta"
    }
}

  createSimplePart() {
    this.partsEventService.setMode("Crear pieza simple");
    this.router.navigate(['../piezas/createSimple']);
  }

  createComposedPart() {
    this.partsEventService.setMode("Crear pieza compuesta");
    this.router.navigate(['../piezas/createComposed']);
  }

  close() {
    this.partsEventService.events.next(4);
  }

}
