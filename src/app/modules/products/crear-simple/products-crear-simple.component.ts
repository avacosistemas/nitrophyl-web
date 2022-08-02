import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from 'app/shared/models/product.model';
import { ProductsService } from 'app/shared/services/products.service';
import { Subscription } from 'rxjs';
import { ProductsEventService } from '../products-event.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-products-crear-simple',
  templateUrl: './products-crear-simple.component.html',
  styleUrls: ['./products-crear-simple.component.scss']
})
export class ProductsCrearSimpleComponent implements OnInit, OnDestroy {

  component = "Producto simple";
  productoSimpleForm: FormGroup;
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
    private productsService: ProductsService,
    private productsEventService: ProductsEventService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productoSimpleForm = this._formBuilder.group({
      codigoPieza: ['', [Validators.required, Validators.maxLength(30)]],
      codigoInterno: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required]]
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
    this.productoSimpleForm.valueChanges.subscribe(x => {
      this.disableButton = false;
    });
    this.buttonAction = "Guardar";
    this.mode = this.productsEventService.getMode();
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
      this.productsEventService.viewEvents.next(7);
      this.productsService.getProducts().subscribe(d => {
        let busqueda = d.data.find(pieza => pieza.id == this.id);
        this.productoSimpleForm.patchValue({
          codigoPieza: busqueda.codigoPieza,
          codigoInterno: busqueda.codigoInterno,
          nombre: busqueda.nombre
        });
        this.buttonAction = "Guardar";
      });
      if(this.mode == "View") {
        this.productoSimpleForm.disable();
      };
    } else {
      this.mode = "Create";
    }
  }

  return() {
    let nav = JSON.parse(localStorage.getItem("navPiezas"));
    if(nav == null) {
      this.router.navigate(['/productos/grid']);
    } else if (nav.length == 0) {
      this.router.navigate(['/productos/grid']);
    } else {
      this.router.navigateByUrl(`/${nav[nav.length - 1].uri}/createComposed/${nav[nav.length - 1].id}`);
    }
  }

  save() {
    this.productoSimpleForm.markAllAsTouched();
    if(!this.productoSimpleForm.valid) {
      return;
    };
    let model: Product = {
      codigoPieza: this.productoSimpleForm.controls.codigoPieza.value,
      codigoInterno: this.productoSimpleForm.controls.codigoInterno.value,
      nombre: this.productoSimpleForm.controls.nombre.value,
      esProducto: true,
      id: 0,
      piezas: [],
      tipo: "SIMPLE"
    };
    if (this.saved == true) {
      this.productsService.updateSimpleProduct(model, this.id).subscribe(d => {
        this.openSnackBar("Cambios realizados", "X", "green-snackbar");
        this.disableButton = true;
      },
      err => {
        this.openSnackBar("No se pudieron realizar los cambios", "X", "red-snackbar");
        console.log(err.error.message);
      });
    } else {
      this.buttonAction = "Guardar";
      this.productsService.createSimpleProduct(model).subscribe(d => {
        this.id = d.data.id;
        this.openSnackBar("Cambios realizados", "X", "green-snackbar");
        this.disableButton = true;
        this.productsEventService.viewEvents.next(7);
      },
      err => {
        this.openSnackBar("No se pudieron realizar los cambios", "X", "red-snackbar");
        console.log(err.error.message);
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
