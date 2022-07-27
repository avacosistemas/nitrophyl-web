import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  constructor(
    private http: HttpClient,
    private handler: HttpBackend) {
        this.http = new HttpClient(handler)
  }

  public getProducts(): Observable<any> {
    return this.http.get<any>(`${environment.server}productos/`);
  };

  public getProdcutById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.server}productos/${id}`);
  }

  public createSimpleProduct(simpleProduct: Product): Observable<any> {
    return this.http.post<any>(`${environment.server}productos/simple/`, simpleProduct);
    //Realizar inserts en la tabla Pieza y PiezaSimple con EsProducto = true y Tipo = Simple
  };

  public updateSimpleProduct(simpleProduct: Product, id: number): Observable<any> {
    return this.http.put<any>(`${environment.server}productos/simple/${id}`, simpleProduct);
    //Actualizar los campos codigoPieza, codigoInterno y nombre.
  };

  public createComposedProduct(composedProduct: Product): Observable<any> {
    return this.http.post<any>(`${environment.server}productos/compuesto/`, composedProduct);
    //Realizar inserts en la tabla Pieza y PiezaCompuesta con EsProducto = true y Tipo = Compuesta
  };

  public updateComposedProduct(composedProduct: Product, id: number): Observable<any> {
    return this.http.put<any>(`${environment.server}productos/compuesto/${id}`, composedProduct);
    //Actualizar los campos codigoPieza, codigoInterno y nombre.
  };

  public addPartToComposedProduct(id: number, idPieza: number): Observable<any> {
    return this.http.post<any>(`${environment.server}productos/compuesto/${id}/agregar/${idPieza}`, null);
    //Buscar la pieza por idPieza y agregarla la listado de productos de la pieza obtenida por id
  };

  public removePartFromComposedProduct(id: number, idPieza: number): Observable<any> {
    return this.http.post<any>(`${environment.server}productos/compuesto/${id}/quitar/${idPieza}`, null);
    //Buscar la pieza por idPieza y quitarla del listado de productos de la pieza obtenida por id
  }

}
