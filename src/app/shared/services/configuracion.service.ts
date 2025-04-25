import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventEmitter,  } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import { IConfiguracion, IConfiguracionesResponse, IConfiguracionResponse } from '../models/configuracion.interface';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  // public actions$ = this.action.asObservable();
  public actions$: Observable<boolean>;

  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  private url: string = `${environment.server}configuracion`;
  private mode: string = '';

  // * Test mode:
  private action = new Subject<boolean>();

  constructor(private http: HttpClient) {
    this.actions$ = new Subject<boolean>();
  }

  public work(option: boolean): void {
    this.action.next(option);
  }

  public get(
    body?: IConfiguracion
  ): Observable<IConfiguracionResponse | IConfiguracionesResponse> {
    let url: string = this.url;

    if (!body) {
      return this.http.get<IConfiguracionesResponse>(`${this.url}?asc=true`);
    }

    if (body.id) {
      return this.http.get<IConfiguracionResponse>(`${this.url}/${body.id}`);
    }

    const params: string[] = [];
    if (body.idCliente) params.push(`idCliente=${body.idCliente}`);
    if (body.idFormula) params.push(`idFormula=${body.idFormula}`);
    if (body.idMaquina) params.push(`idMaquina=${body.idMaquina}`);
    if (body.mostrarCondiciones) params.push(`mostrarCondiciones=${body.mostrarCondiciones}`);
    if (body.enviarGrafico) params.push(`enviarGrafico=${body.enviarGrafico}`);
    if (body.mostrarObservacionesParametro) params.push(`mostrarObservacionesParametro=${body.mostrarObservacionesParametro}`);
    if (body.mostrarParametros) params.push(`mostrarParametros=${body.mostrarParametros}`);
    if (body.mostrarResultados) params.push(`mostrarResultados=${body.mostrarResultados}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<IConfiguracionesResponse>(url);
  }

  public post(body: IConfiguracion): Observable<IConfiguracionResponse> {
    return this.http.post<IConfiguracionResponse>(`${this.url}`, body);
  }

  public put(body: IConfiguracion): Observable<IConfiguracionResponse> {
    return this.http.put<IConfiguracionResponse>(`${this.url}/${body.id}`, body);
  }

  public delete(id: number): Observable<IConfiguracionResponse> {
    return this.http.delete<IConfiguracionResponse>(`${this.url}/${id}`);
  }

  public getMode(): string {
    return this.mode;
  }

  public setMode(mode: string): void {
    this.mode = mode;
  }
}