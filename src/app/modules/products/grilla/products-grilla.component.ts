import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProductsService } from 'app/shared/services/products.service';
import { ProductsEventService } from '../products-event.service';

@Component({
  selector: 'app-products-grilla',
  templateUrl: './products-grilla.component.html',
  styleUrls: ['./products-grilla.component.scss']
})
export class ProductsGrillaComponent implements OnInit, AfterViewInit {

  component = 'Grilla';
  products = [];
  productsBackup = [];
  displayedColumns: string[] = ['code', 'type', 'acciones'];
  searchForm: FormGroup;
  panelOpenState = true;

  constructor(
    private productsService: ProductsService,
    private productsEventService: ProductsEventService,
    private _formBuilder: FormBuilder
  ) {
    this.searchForm = this._formBuilder.group({
      codigo: [''],
      tipo: ['']
    });
  }

  ngOnInit(): void {
    localStorage.removeItem('navPiezas');
    this.getProductos();
  }

  public getProductos(): void {
    this.productsService.getProducts().subscribe((d) => {
      this.products = d.data;
      this.productsBackup = this.products;
    });
  }

  ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  search(): void {
    let searchProducts = [];
    if (this.searchForm.controls.tipo.value === 'SIMPLE') {
      searchProducts = this.productsBackup.filter(p => p.tipo === 'SIMPLE');
    } else if (this.searchForm.controls.tipo.value === 'COMPUESTA') {
      searchProducts = this.productsBackup.filter(p => p.tipo === 'COMPUESTA');
    } else {
      searchProducts = this.productsBackup;
    };
    this.products = searchProducts.filter(element => element.codigoPieza.toLowerCase().includes(this.searchForm.controls.codigo.value.toLowerCase()));
  }

  openProduct(id: number): void {
    if (id === 1) {
      //Editar
      this.productsEventService.setMode('Edit');
    } else {
      //Ver
      this.productsEventService.setMode('View');
    }
  }

  limpiarFiltros(): void {
    this.searchForm.reset({
      codigo: [''],
      tipo: ['']
    });

    this.getProductos();
  }


}
