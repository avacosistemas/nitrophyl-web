import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductsService } from 'app/shared/services/products.service';
import { Subscription } from 'rxjs';
import { ProductsEventService } from './products-event.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, OnDestroy, AfterContentChecked {

  titulo: string = '';
  tituloNav: string = "Listado";
  suscripcion: Subscription;
  botonEdicion: string = '';

  constructor(
    private productsService: ProductsService,
    private peoductsEventService: ProductsEventService,
    private router: Router,
    private cdref: ChangeDetectorRef
  ) {
    this.suscripcion = this.peoductsEventService.viewEvents.subscribe(
      (data: any) => {
        /*
        0 - Guardar producto simple
        1 - Guardar producto compuesto
        2 - Nuevo producto simple
        3 - Nuevo producto compuesto
        4 - Volver
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
      this.titulo = "Consulta Productos";
      this.tituloNav = "Listado"
    }
    if (event.component == "Producto simple") {
      this.titulo = "Nuevo producto simple";
      this.tituloNav = "Producto simple"
    }
    if (event.component == "Producto compuesto") {
      this.titulo = "Nuevo producto compuesto";
      this.tituloNav = "Producto compuesto"
    }
  }

  createSimpleProduct() {
    this.peoductsEventService.setMode("Crear pieza simple");
    this.router.navigate(['../productos/createSimple']);
  }

  createComposedProduct() {
    this.peoductsEventService.setMode("Crear pieza compuesta");
    this.router.navigate(['../productos/createComposed']);
  }

  close() {
    this.peoductsEventService.events.next(4);
  }

}
