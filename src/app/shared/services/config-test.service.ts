import { HttpClient, HttpBackend } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigTestService {
  private url: string = `${environment.server}configuracionPrueba`;
  private mode: string = '';

  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public getMachines(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/formula/${id}`);
  }

  public get(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  public post(body: any): Observable<any> {
    return this.http.post<any>(`${this.url}`, body);
  }
}
