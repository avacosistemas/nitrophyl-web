import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IInsumoApiResponse, IInsumo, IInsumoSingleApiResponse } from './models/insumo.interface';
import { ITipoInsumo, ITipoInsumoApiResponse } from './models/tipo-insumo.interface';


@Injectable({
    providedIn: 'root'
})
export class AbmInsumosService {
    private readonly apiUrl = `${environment.server}insumo`;
    private readonly tipoInsumoApiUrl = `${environment.server}tipoInsumo/soloHijos`;

    constructor(private http: HttpClient) { }

    getInsumos(filters: { nombre?: string } = {}): Observable<IInsumoApiResponse> {
        let params = new HttpParams();
        if (filters.nombre) {
            params = params.set('nombre', filters.nombre);
        }
        return this.http.get<IInsumoApiResponse>(this.apiUrl, { params });
    }

    createInsumo(dto: Partial<IInsumo>): Observable<IInsumoSingleApiResponse> {
        const { id, ...insumoData } = dto;
        return this.http.post<IInsumoSingleApiResponse>(this.apiUrl, insumoData);
    }

    updateInsumo(id: number, dto: Partial<IInsumo>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto);
    }

    deleteInsumo(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            catchError((error: HttpErrorResponse) => {
                return throwError(() => error);
            })
        );
    }

    getTiposInsumo(): Observable<ITipoInsumo[]> {
        return this.http.get<ITipoInsumoApiResponse>(this.tipoInsumoApiUrl).pipe(
            map(response => response.data.map(t => ({
                ...t,
                codigo: Number(t.codigo)
            }))),
            catchError((error: HttpErrorResponse) => {
                console.error('Error al cargar tipos de insumo:', error);
                return throwError(() => new Error('No se pudieron cargar los tipos de insumo.'));
            })
        );
    }
}