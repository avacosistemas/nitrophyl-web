import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { ITratamientoApiResponse, ITratamientoDto, ITratamientoSingleApiResponse } from './models/tratamiento.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmTratamientoService {
    private readonly apiUrl = `${environment.server}tratamiento`;

    constructor(private http: HttpClient) { }

    getTratamientos(): Observable<ITratamientoApiResponse> {
        let params = new HttpParams();
        params = params.set('nombre', '');

        return this.http.get<ITratamientoApiResponse>(this.apiUrl, { params }).pipe(
            catchError(this.handleError)
        );
    }

    createTratamiento(dto: ITratamientoDto): Observable<ITratamientoSingleApiResponse> {
        return this.http.post<ITratamientoSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updateTratamiento(id: number, dto: ITratamientoDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deleteTratamiento(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            catchError((error: HttpErrorResponse) => {
                return throwError(() => error);
            })
        );
    }

    private handleError(error: HttpErrorResponse) {
        console.error('API Error:', error);
        return throwError(() => new Error('Ocurrió un error en la comunicación con el servidor.'));
    }
}