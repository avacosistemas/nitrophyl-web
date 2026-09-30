import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter,  } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import { IConfiguracion, IConfiguracionesResponse, IConfiguracionResponse } from './configuracion.interface';

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
  ): Observable<any> {
    if (body && body.id) {
      return this.http.get<IConfiguracionResponse>(`${this.url}/${body.id}`);
    }

    const params: any = { ...body };
    delete params.cliente;
    delete params.formula;
    delete params.maquina;
    delete params.idsPruebas;

    if (params.page === undefined) {
      params.page = 0;
    }
    if (params.pageSize === undefined) {
      params.pageSize = 10;
    }
    if (params.asc === undefined) {
      params.asc = true;
    }

    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== null && params[k] !== undefined && params[k] !== '') {
        httpParams = httpParams.set(k, String(params[k]));
      }
    });

    return this.http.get<any>(this.url, { params: httpParams });
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