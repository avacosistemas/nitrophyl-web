import { HttpClient, HttpBackend } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import {
  IConfigTestResponse,
  IConfigTestsResponse,
} from '../models/config-test.interface';

@Injectable({ providedIn: 'root' })
export class ConfigTestService {
  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  private _url: string = `${environment.server}configuracionPrueba`;

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public getMachines(
    id: number
  ): Observable<IConfigTestsResponse | IConfigTestResponse> {
    return this.http.get<IConfigTestsResponse | IConfigTestResponse>(
      `${this._url}/formula/${id}`
    );
  }

  public getMachinesVigentes(
    id: number
  ): Observable<IConfigTestsResponse | IConfigTestResponse> {
    return this.http.get<IConfigTestsResponse | IConfigTestResponse>(
      `${this._url}/lote/${id}/vigentes`
    );
  }

  public getId(id: number): Observable<IConfigTestResponse> {
    return this.http.get<IConfigTestResponse>(`${this._url}/${id}`);
  }

  public get(id: number): Observable<any> {
    return this.http.get<any>(`${this._url}/${id}`);
  }

  public post(body: any): Observable<any> {
    return this.http.post<any>(`${this._url}`, body);
  }
}
