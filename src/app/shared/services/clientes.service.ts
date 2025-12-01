import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import {
  Cliente,
  Contacto,
  Domicilio,
  ResponseCliente,
  ResponseClientes,
  ResponseContacto,
  ResponseContactos,
  ResponseDomicilio,
  ResponseDomicilios,
} from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private mode: string;

  constructor(private http: HttpClient) {
  }

  public getClientes(): Observable<ResponseClientes> {
    return this.http.get<ResponseClientes>(`${environment.server}clientes/`);
  }

  public createCliente(cliente: Cliente): Observable<any> {
    return this.http.post<any>(`${environment.server}cliente`, cliente);
  }

  public updateCliente(id: number, cliente: Cliente): Observable<any> {
    return this.http.put<any>(`${environment.server}cliente/${id}`, cliente);
  }

  public getClienteById(id: number): Observable<ResponseCliente> {
    return this.http.get<ResponseCliente>(`${environment.server}cliente/${id}`);
  }

  public getContactos(id: number): Observable<ResponseContactos> {
    return this.http.get<ResponseContactos>(
      `${environment.server}cliente/${id}/contacto`
    );
  }

  public getContactoById(id: number): Observable<ResponseContacto> {
    return this.http.get<ResponseContacto>(
      `${environment.server}cliente/contacto/${id}`
    );
  }

  public createContacto(id: number, contacto: Contacto): Observable<any> {
    return this.http.post<any>(
      `${environment.server}cliente/${id}/contacto`,
      contacto
    );
  }

  public updateContacto(id: number, contacto: Contacto): Observable<any> {
    return this.http.put<any>(
      `${environment.server}cliente/contacto/${id}`,
      contacto
    );
  }

  public deleteContacto(idContacto: number): Observable<any> {
    return this.http.delete<any>(
      `${environment.server}cliente/contacto/${idContacto}`
    );
  }

  public getProvincias(): Observable<any> {
    return this.http.get<any>(`${environment.server}provincias/`);
  }

  public getMode(): string {
    return this.mode;
  }

  public setMode(mode: string): void {
    this.mode = mode;
  }

  getCorreoInforme(idCliente: number): Observable<any> {
    return this.http.get<any>(`${environment.server}cliente/correoinforme/${idCliente}`);
  }

  public getDomicilios(idCliente: number): Observable<ResponseDomicilios> {
    return this.http.get<ResponseDomicilios>(
      `${environment.server}clienteDomicilio?idCliente=${idCliente}`
    );
  }

  public getDomicilioById(id: number): Observable<ResponseDomicilio> {
    return this.http.get<ResponseDomicilio>(
      `${environment.server}clienteDomicilio/${id}`
    );
  }

  public createDomicilio(domicilio: Domicilio): Observable<any> {
    return this.http.post<any>(
      `${environment.server}clienteDomicilio`,
      domicilio
    );
  }

  public updateDomicilio(id: number, domicilio: Domicilio): Observable<any> {
    return this.http.put<any>(
      `${environment.server}clienteDomicilio/${id}`,
      domicilio
    );
  }

  public deleteDomicilio(id: number): Observable<any> {
    return this.http.delete<any>(
      `${environment.server}clienteDomicilio/${id}`
    );
  }
}