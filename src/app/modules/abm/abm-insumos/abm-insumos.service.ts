import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IInsumoApiResponse, IInsumo, IInsumoSingleApiResponse, IInsumoStockHistorialApiResponse, ICreateInsumoStock } from './models/insumo.interface';
import { ITipoInsumo, ITipoInsumoApiResponse } from './models/tipo-insumo.interface';
import { IMateriaPrima, IMateriaPrimaApiResponse } from './models/materia-prima.interface';


@Injectable({
    providedIn: 'root'
})
export class AbmInsumosService {
    private readonly apiUrl = `${environment.server}insumo`;
    private readonly tipoInsumoApiUrl = `${environment.server}tipoInsumo/soloHijos`;
    private readonly materiaPrimaApiUrl = `${environment.server}materiaPrima`;
    private readonly apiStockUrl = `${environment.server}insumoStockHistorial`;

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

    getMateriasPrimas(): Observable<IMateriaPrima[]> {
        const params = new HttpParams().set('rows', '9999');
        return this.http.get<IMateriaPrimaApiResponse>(this.materiaPrimaApiUrl, { params }).pipe(
            map(response => response.data.page || []),
            catchError((error: HttpErrorResponse) => {
                console.error('Error al cargar materias primas:', error);
                return throwError(() => new Error('No se pudieron cargar las materias primas.'));
            })
        );
    }

    getInsumoStockHistorial(idInsumo: number): Observable<IInsumoStockHistorialApiResponse> {
        const params = new HttpParams().set('sort', 'fecha,desc');
        return this.http.get<IInsumoStockHistorialApiResponse>(`${this.apiStockUrl}/${idInsumo}`, { params });
    }

    createInsumoStock(dto: ICreateInsumoStock): Observable<any> {
        return this.http.post(this.apiStockUrl, dto);
    }
}