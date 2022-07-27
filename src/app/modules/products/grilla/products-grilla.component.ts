import { Component, OnInit } from '@angular/core';
import { ProductsService } from 'app/shared/services/products.service';
import { ProductsEventService } from '../products-event.service';

@Component({
  selector: 'app-products-grilla',
  templateUrl: './products-grilla.component.html',
  styleUrls: ['./products-grilla.component.scss']
})
export class ProductsGrillaComponent implements OnInit {

  component = "Grilla";
  products = [];
  displayedColumns: string[] = ['code', 'type', 'acciones'];

  constructor(
    private productsService: ProductsService,
    private productsEventService: ProductsEventService
  ) { }

  ngOnInit(): void {
    localStorage.removeItem("navPiezas");
    this.productsService.getProducts().subscribe(d => {
      this.products = d.data;
    })
  }

  openProduct(id: number) {
    if(id == 1) {
      //Editar
      this.productsEventService.setMode("Edit");
  } else {
      //Ver
      this.productsEventService.setMode("View");
  }
  }

}
