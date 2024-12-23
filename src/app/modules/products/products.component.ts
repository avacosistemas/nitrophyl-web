import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductsService } from 'app/shared/services/products.service';
import { PartsEventService } from 'app/modules/parts/parts-event.service';
import { Subscription } from 'rxjs';
import { ProductsEventService } from './products-event.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, OnDestroy, AfterContentChecked {

  titulo: string = '';
  tituloNav: string = 'Listado';
  suscripcion: Subscription;
  botonEdicion: string = '';

  constructor(
    private productsService: ProductsService,
    private productsEventService: ProductsEventService,
    private partsEventService: PartsEventService,
    private router: Router,
    private cdref: ChangeDetectorRef
  ) {
    this.suscripcion = this.productsEventService.viewEvents.subscribe((data: any) => {
      /*
        0 - Guardar producto simple
        1 - Guardar producto compuesto
        2 - Nuevo producto simple
        3 - Nuevo producto compuesto
        4 - Volver
        5 - Modificar pieza simple
        6 - Modificar pieza compuesta
        7 - Modificar producto simple
        8 - Modificar producto compuesto
      */
      const modeProducts = this.productsEventService.getMode();
      const modeParts = this.partsEventService.getMode();

      if (data === 0) {
      } else if (data === 1) {
      } else if (data === 2) {
      } else if (data === 3) {
      } else if (data === 4) {
      } else if (data === 5) {
        this.titulo = `${modeParts === 'Edit' ? 'Modificar' : 'Vista'} pieza simple`;
      } else if (data === 6) {
        this.titulo = `${modeParts === 'Edit' ? 'Modificar' : 'Vista'} pieza compuesta`;
      } else if (data === 7) {
        this.titulo = `${modeProducts === 'Edit' ? 'Modificar' : 'Vista'} producto simple`;
      } else if (data === 8) {
        this.titulo = `${modeProducts === 'Edit' ? 'Modificar' : 'Vista'} producto compuesto`;
      }
    });
  }

  ngOnInit(): void {
    this.botonEdicion = '';
  }

  ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  handleAction(action: string): void {
    switch (action) {
      case 'createComposedProduct':
        this.createComposedProduct();
        break;
      case 'createSimpleProduct':
        this.createSimpleProduct();
        break;
      case 'close':
        this.close();
        break;
    }
  }

  componentAdded(event): void {
    if (event.component === 'Grilla') {
      this.titulo = 'Consulta Productos';
      this.tituloNav = 'Listado';
    }
    if (event.component === 'Producto simple') {
      this.titulo = 'Nuevo producto simple';
      this.tituloNav = 'Producto simple';
    }
    if (event.component === 'Producto compuesto') {
      this.titulo = 'Nuevo producto compuesto';
      this.tituloNav = 'Producto compuesto';
    }
  }

  createSimpleProduct(): void {
    this.productsEventService.setMode('Crear pieza simple');
    this.router.navigate(['../productos/createSimple']);
  }

  createComposedProduct(): void {
    this.productsEventService.setMode('Crear pieza compuesta');
    this.router.navigate(['../productos/createComposed']);
  }

  close(): void {
    this.productsEventService.events.next(4);
  }
}
