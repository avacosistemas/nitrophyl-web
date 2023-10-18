import { HttpClient, HttpBackend } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import {
  IFormula,
  IFormulaResponse,
  IFormulasResponse,
} from '../models/formula.interface';

@Injectable({
  providedIn: 'root',
})
export class FormulasService {
  private url: string = `${environment.server}formula`;
  private mode: string = '';

  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public get(
    body?: IFormula
  ): Observable<IFormulaResponse | IFormulasResponse> {
    let url: string;

    if (!body) return this.http.get<IFormulasResponse>(`${this.url}`);

    if (body.id)
      return this.http.get<IFormulaResponse>(`${this.url}/${body.id}`);

    if (body.nombre && body.idMaterial) {
      url = `${this.url}?nombre=${body.nombre}&idMaterial=${body.idMaterial}`;
    } else {
      if (body.nombre) url = `${this.url}?nombre=${body.nombre}`;
      if (body.idMaterial) url = `${this.url}?idMaterial=${body.idMaterial}`;
    }

    return this.http.get<IFormulasResponse>(`${url}`);
  }

  public getMachines(id: number): Observable<any> {
    return this.http.get<any>(
      `${environment.server}configuracionPrueba/formula/${id}`
    );
  }

  public post(body: IFormula): Observable<IFormulaResponse> {
    return this.http.post<IFormulaResponse>(`${this.url}`, body);
  }

  public put(body: IFormula): Observable<IFormulaResponse> {
    return this.http.put<IFormulaResponse>(`${this.url}/${body.id}`, body);
  }

  public getMode(): string {
    return this.mode;
  }

  public setMode(mode: string) {
    this.mode = mode;
  }
}
