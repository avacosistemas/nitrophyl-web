import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IAdhesivoApiResponse, IAdhesivoDto, IAdhesivoSingleApiResponse } from './models/adhesivo.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmAdhesivosService {
    private readonly apiUrl = `${environment.server}adhesivo`;

    constructor(private http: HttpClient) { }

    getAdhesivos(): Observable<IAdhesivoApiResponse> {
        let params = new HttpParams();
        params = params.set('nombre', '');
        return this.http.get<IAdhesivoApiResponse>(this.apiUrl, { params }).pipe(
            catchError(this.handleError)
        );
    }

    createAdhesivo(dto: IAdhesivoDto): Observable<IAdhesivoSingleApiResponse> {
        return this.http.post<IAdhesivoSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updateAdhesivo(id: number, dto: IAdhesivoDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deleteAdhesivo(id: number): Observable<any> {
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