import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Part, PartResponse } from '../models/part.model';

@Injectable({
  providedIn: 'root'
})
export class PartsService {

  constructor(
    private http: HttpClient) {
  }

  public getParts(): Observable<any> {
    return this.http.get<any>(`${environment.server}piezas/`);
    //querystring parameters
    //busqueda (string), pagina, registros, orden
    /*
    Buscar las piezas que tengan EsProducto = false y que la búsqueda matchee con codigoPieza, codigoInterno o nombre total o parcialmente. 
    Ordenar el resultado por “orden” y paginar usando “pagina” y “registros”. 
    Revisar que el framework ya realiza este trabajo de filtrar, ordenar y paginar.
    */
  }

  public getPartById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.server}piezas/${id}`);
    //querystring parameters
    //busqueda (string)
    /*
    Buscar las piezas que tengan EsProducto = false y que la búsqueda matchee con codigoPieza, codigoInterno o nombre total o parcialmente. 
    Solo ordenar por nombre.
    */
  }

  public createSimplePart(simplePart: Part): Observable<PartResponse> {
    return this.http.post<PartResponse>(`${environment.server}piezas/simple/`, simplePart);
    //codigoPieza
    //codigoInterno
    //nombre
    //Realizar inserts en la tabla Pieza y PiezaSimple con EsProducto = false y Tipo = Simple
  }

  public updateSimplePart(simplePart: Part, id: number): Observable<PartResponse> {
    return this.http.put<PartResponse>(`${environment.server}piezas/simple/${id}`, simplePart);
    //codigoPieza
    //codigoInterno
    //nombre
    //Actualizar los campos codigoPieza, codigoInterno y nombre.
  }

  public createComposedPart(composedPart: Part): Observable<PartResponse> {
    return this.http.post<PartResponse>(`${environment.server}piezas/compuesta/`, composedPart);
    //codigoPieza
    //codigoInterno
    //nombre
    //Realizar inserts en la tabla Pieza y PiezaCompuesta con EsProducto = false y Tipo = Compuesta
  }

  public updateComposedPart(composedPart: Part, id: number): Observable<PartResponse> {
    return this.http.put<PartResponse>(`${environment.server}piezas/compuesta/${id}`, composedPart);
    //codigoPieza
    //codigoInterno
    //nombre
    //Actualizar los campos codigoPieza, codigoInterno y nombre.
  }

  public addPartToComposedPart(id: number, idPieza: number): Observable<any> {
    return this.http.post<any>(`${environment.server}piezas/compuesta/${id}/agregar/${idPieza}`, null);
    //Buscar la pieza por idPieza y agregarla la listado de piezas de la pieza obtenida por id
  }

  public removePartFromComposedPart(id: number, idPieza: number): Observable<any> {
    return this.http.post<any>(`${environment.server}piezas/compuesta/${id}/quitar/${idPieza}`, null);
    //Buscar la pieza por idPieza y quitarla del listado de piezas de la pieza obtenida por id
  }
}