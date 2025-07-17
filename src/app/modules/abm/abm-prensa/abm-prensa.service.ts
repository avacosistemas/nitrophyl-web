import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IPrensaApiResponse, IPrensaDto, IPrensaSingleApiResponse } from './models/prensa.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmPrensaService {
    private readonly apiUrl = `${environment.server}prensa`;

    constructor(private http: HttpClient) { }

    getPrensas(): Observable<IPrensaApiResponse> {
        return this.http.get<IPrensaApiResponse>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }

    createPrensa(dto: IPrensaDto): Observable<IPrensaSingleApiResponse> {
        return this.http.post<IPrensaSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updatePrensa(id: number, dto: IPrensaDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deletePrensa(id: number): Observable<any> {
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