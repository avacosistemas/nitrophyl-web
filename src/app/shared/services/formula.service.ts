import { HttpClient, HttpBackend } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import {
  IFormula,
  IFormulaResponse,
  IMaterialResponse,
} from '../models/formula.model';

@Injectable({
  providedIn: 'root',
})
export class FormulaService {
  private url: string = `${environment.server}formula`;
  private mode: string = '';

  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public getFormulas(body?: IFormula): Observable<IFormulaResponse> {
    let url: string;

    if (!body) return this.http.get<any>(`${this.url}`);

    if (body.nombre && body.idMaterial) {
      url = `${this.url}?nombre=${body.nombre}&idMaterial=${body.idMaterial}`;
    } else {
      if (body.nombre) url = `${this.url}?nombre=${body.nombre}`;
      if (body.idMaterial) url = `${this.url}?idMaterial=${body.idMaterial}`;
    }

    return this.http.get<IFormulaResponse>(`${url}`);
  }

  public getFormula(id: number): Observable<IFormulaResponse> {
    return this.http.get<IFormulaResponse>(`${this.url}/${id}`);
  }

  public getMaterials(): Observable<IMaterialResponse> {
    return this.http.get<IMaterialResponse>(`${environment.server}material`);
  }

  public post(body: IFormula): Observable<IFormulaResponse> {
    return this.http.post<IFormulaResponse>(`${this.url}`, body);
  }

  public put(body: IFormula): Observable<IFormulaResponse> {
    return this.http.put<IFormulaResponse>(`${this.url}/${body.id}`, body);
  }

  public getMode() {
    return this.mode;
  }

  public setMode(mode: string) {
    this.mode = mode;
  }
}
