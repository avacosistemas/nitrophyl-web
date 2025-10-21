import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IInsumoTipo, IInsumoTipoApiResponse, IInsumoTipoDto, IInsumoTipoSingleApiResponse } from './models/insumo-tipo.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmInsumoTipoService {
    private readonly apiUrl = `${environment.server}tipoInsumo`;

    constructor(private http: HttpClient) { }

    getInsumoTipos(): Observable<IInsumoTipo[]> {
        return this.http.get<IInsumoTipoApiResponse>(this.apiUrl + '/soloHijos').pipe(
            map(response => response.data || []),
            catchError(this.handleError)
        );
    }

    createInsumoTipo(dto: IInsumoTipoDto): Observable<IInsumoTipoSingleApiResponse> {
        return this.http.post<IInsumoTipoSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updateInsumoTipo(id: number, dto: IInsumoTipoDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deleteInsumoTipo(id: number): Observable<any> {
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