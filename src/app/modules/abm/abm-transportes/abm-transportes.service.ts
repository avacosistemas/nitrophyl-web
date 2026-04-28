import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { ITransporteApiResponse, ITransporteDto, ITransporteSingleApiResponse } from './models/transporte.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmTransportesService {
    private readonly apiUrl = `${environment.server}transporte`;

    constructor(private http: HttpClient) { }

    getTransportes(): Observable<ITransporteApiResponse> {
        let params = new HttpParams();
        params = params.set('nombre', '');
        return this.http.get<ITransporteApiResponse>(this.apiUrl, { params }).pipe(
            catchError(this.handleError)
        );
    }

    createTransporte(dto: ITransporteDto): Observable<ITransporteSingleApiResponse> {
        return this.http.post<ITransporteSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updateTransporte(id: number, dto: ITransporteDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deleteTransporte(id: number): Observable<any> {
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
