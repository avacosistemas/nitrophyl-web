
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PartsEventService } from 'app/modules/parts/parts-event.service';
import { Part } from 'app/shared/models/part.model';
import { Product } from 'app/shared/models/product.model';
import { PartsService } from 'app/shared/services/parts.service';
import { ProductsService } from 'app/shared/services/products.service';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProductsEventService } from '../products-event.service';

@Component({
  selector: 'app-products-crear-compuesta',
  templateUrl: './products-crear-compuesta.component.html',
  styleUrls: ['./products-crear-compuesta.component.scss']
})
export class ProductsCrearCompuestaComponent implements OnInit, OnDestroy {

  component = "Producto compuesto";
  displayedColumns: string[] = ['code', 'type', 'acciones'];
  parts = [];
  productoCompuestoForm: FormGroup;
  piezaCompuestaExtendidaForm: FormGroup;
  suscripcion: Subscription;
  saved: boolean = false;
  mode: string = "";
  showSuccess: boolean = false;
  showError: boolean = false;
  buttonAction: string = "";
  id: number = null;
  tiposPiezas: Array<string> = ['SIMPLE', 'COMPUESTA'];
  listaPiezas: Array<Part> = [];
  listaPiezasPorTipo: Array<Part> = [];
  listaPiezasFiltradas: Observable<Part[]>;

  constructor(
    private _formBuilder: FormBuilder,
    private partsService: PartsService,
    private productsService: ProductsService,
    private partsEventService: PartsEventService,
    private productsEventService: ProductsEventService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productoCompuestoForm = this._formBuilder.group({
      codigoPieza: ['', [Validators.required, Validators.maxLength(30)]],
      codigoInterno: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required]]
    });
    this.piezaCompuestaExtendidaForm = this._formBuilder.group({
      listaTipos:[''],
      listaPiezas: ['']
    });
    this.suscripcion = this.productsEventService.events.subscribe(
      (data: any) => {
        if (data == 4) {
          this.return();
        }
      }
    );
  }

  ngOnInit(): void {
    this.buttonAction = "Guardar";
    this.mode = this.productsEventService.getMode();
    if(this.mode == null) {
      this.mode = "View";
    };
    this.inicializar();
    this.extendedFormCheck();
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  inicializar() {
    this.piezaCompuestaExtendidaForm.disable();
    let nav = JSON.parse(localStorage.getItem("navPiezas"));
    this.partsService.getParts().subscribe(d => {
      this.listaPiezas = d.data;
    });
    if(this.route.snapshot.params.id != undefined) {
      this.id = this.route.snapshot.params.id;
      if(nav != null) {
        if(nav[nav.length - 1].id == this.id) {
          this.mode = nav[nav.length - 1].mode;
          nav.splice(nav.length - 1, 1);
          if(nav.length == 0) {
            localStorage.removeItem("navPiezas");
          } else {
            localStorage.setItem("navPiezas", JSON.stringify(nav));
          }
        }
      };
      this.saved = true;
      this.productsService.getProdcutById(this.id).subscribe(d => {
        this.productoCompuestoForm.patchValue({
          codigoPieza: d.data.codigoPieza,
          codigoInterno: d.data.codigoInterno,
          nombre: d.data.nombre
        });
        if(d.data.piezas != null) {
          if(d.data.piezas.length > 0) {
            this.parts = d.data.piezas;
          };
        };
        this.buttonAction = "Guardar";
      })
      if(this.mode == "View") {
        this.productoCompuestoForm.disable();
      };
    } else {
      this.mode = "Create";
    };
  }

  extendedFormCheck() {
    if(this.id != null && this.mode != "View") {
      this.piezaCompuestaExtendidaForm.enable();
    };
  }

  return() {
    let nav = JSON.parse(localStorage.getItem("navPiezas"));
    if(nav == null) {
      this.router.navigate(['/productos/grid']);
    } else if (nav.length == 0) {
      this.router.navigate(['/productos/grid']);
    } else {
      nav[nav.length - 1].id;
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=>
      this.router.navigate([`/${nav[nav.length - 1].uri}/createComposed/${nav[nav.length - 1].id}`]));
    }
  }

  save() {
    this.showSuccess = false;
    this.showError = false;
    this.productoCompuestoForm.markAllAsTouched();
    if(!this.productoCompuestoForm.valid) {
      return;
    };
    let model: Product = {
      codigoPieza: this.productoCompuestoForm.controls.codigoPieza.value,
      codigoInterno: this.productoCompuestoForm.controls.codigoInterno.value,
      nombre: this.productoCompuestoForm.controls.nombre.value,
      esProducto: true,
      id: 0,
      piezas: [],
      tipo: "COMPUESTA"
    };
    if (this.saved) {
      this.productsService.updateComposedProduct(model, this.id).subscribe(d => {
        this.mode = "Edit";
        this.extendedFormCheck();
        this.showSuccess = true;
      });
    } else {
      this.buttonAction = "Guardar";
      this.productsService.createComposedProduct(model).subscribe(d => {
        this.showSuccess = true;
        this.id = d.data.id;
        this.saved = true;
        this.mode = "Edit";
        this.extendedFormCheck();
      });
    }
  }

  createSimplePart() {
    this.setNav();
    this.router.navigate(['/piezas/createSimple']);
  }

  createComposedPart() {
    this.setNav();
    this.router.navigate([`/piezas/createComposed`]);
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=>
    this.router.navigate([`/piezas/createComposed`]));
  }

  typeSelectChange(event) {
    this.listaPiezasPorTipo = this.listaPiezas.filter(pieza => pieza.tipo == event.value);
    this.listaPiezasFiltradas = this.piezaCompuestaExtendidaForm.controls.listaPiezas.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): Part[] {
    const filterValue = value.toLowerCase();

    return this.listaPiezasPorTipo.filter(option => option.codigoPieza.toLowerCase().includes(filterValue));
  }

  setNav() {
    let nav = JSON.parse(localStorage.getItem("navPiezas"));
    if(nav == null) {
      nav = [{action: "Producto compuesto", id: this.id, mode: this.mode, uri: "productos"}];
      localStorage.setItem("navPiezas", JSON.stringify(nav));
    } else {
      nav.push({action: "Producto compuesto", id: this.id, mode: this.mode, uri: "productos"});
      localStorage.setItem("navPiezas", JSON.stringify(nav));
    };
  }

  addPart() {
    this.piezaCompuestaExtendidaForm.markAllAsTouched();
    let find = this.listaPiezasPorTipo.find(pieza => pieza.codigoPieza == this.piezaCompuestaExtendidaForm.controls.listaPiezas.value);
    if(find == undefined) {
      return;
    }
    let busqueda = this.listaPiezas.find(pieza => pieza.codigoPieza == this.piezaCompuestaExtendidaForm.controls.listaPiezas.value);
    this.piezaCompuestaExtendidaForm.reset();
    this.typeSelectChange('');
    this.parts.push(busqueda);
    this.parts = [...this.parts];
    this.productsService.addPartToComposedProduct(this.id, busqueda.id).subscribe(d => {});
  }

  viewPart(row: Part) {
    this.setNav();
    this.partsEventService.setMode("View");
    if(row.tipo == "SIMPLE") {
      this.router.navigate([`/piezas/createSimple/${row.id}`]);
    } else {
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=>
      this.router.navigate([`/piezas/createComposed/${row.id}`]));
    }
  }

  editPart(row: Part) {
    this.setNav();
    this.partsEventService.setMode("Edit");
    if(row.tipo == "SIMPLE") {
      this.router.navigate([`/piezas/createSimple/${row.id}`]);
    } else {
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=>
      this.router.navigate([`/piezas/createComposed/${row.id}`]));
    }
  }

  deletePart(index: number, row: Part) {
    this.parts.splice(index, 1);
    this.parts = [...this.parts];
    this.productsService.removePartFromComposedProduct(this.id, row.id).subscribe(d => {});
  }

}
