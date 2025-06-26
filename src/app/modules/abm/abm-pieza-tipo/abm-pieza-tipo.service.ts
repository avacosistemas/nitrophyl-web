import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IPiezaTipoApiResponse } from './models/pieza-tipo.interface';

@Injectable({
  providedIn: 'root'
})
export class AbmPiezaTipoService {
  private readonly apiUrl = `${environment.server}piezaTipo`;

  constructor(private http: HttpClient) { }

  getPiezaTipos(): Observable<IPiezaTipoApiResponse> {
    return this.http.get<IPiezaTipoApiResponse>(this.apiUrl);
  }

  createPiezaTipo(dto: { nombre: string }): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  updatePiezaTipo(id: number, dto: { nombre: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { id, ...dto });
  }

  deletePiezaTipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }
}