import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Cliente,
  ResponseClientesCombo,
  Contacto,
  Domicilio,
  ResponseCliente,
  ResponseClientes,
  ResponseContacto,
  ResponseContactos,
  ResponseDomicilio,
  ResponseDomicilios,
} from './cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private mode: string;

  constructor(private http: HttpClient) {
  }

  public getClientes(): Observable<ResponseClientes> {
    return this.http.get<ResponseClientes>(`${environment.server}clientes/`).pipe(
      map(response => ({
        ...response,
        data: (response.data || []).slice().sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
        )
      }))
    );
  }

  public getClientesAutocomplete(busquedaRapida: string = ''): Observable<ResponseClientesCombo> {
    let params = new HttpParams()
      .set('page', '0')
      .set('pageSize', '25')
      .set('asc', 'true')
      .set('idx', 'nombre');
    if (busquedaRapida.trim()) {
      params = params.set('busquedaRapida', busquedaRapida.trim());
    }

    return this.http.get<ResponseClientesCombo>(`${environment.server}clientes/autocomplete`, { params }).pipe(
      map(response => ({
        ...response,
        data: (response.data || []).map((item: any) => ({
          id: Number(item.codigo),
          codigo: item.codigo,
          nombre: item.nombre,
          razonSocial: ''
        })).sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
        )
      }))
    );
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

  public getPaises(): Observable<any> {
    return this.http.get<any>(`${environment.server}pais`);
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

  public getDomicilios(idCliente: number, tipoDomicilio?: string): Observable<ResponseDomicilios> {
    let params = new HttpParams().set('idCliente', idCliente.toString());
    if (tipoDomicilio) {
      params = params.set('tipoDomicilio', tipoDomicilio);
    }
    return this.http.get<ResponseDomicilios>(`${environment.server}clienteDomicilio`, { params });
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
