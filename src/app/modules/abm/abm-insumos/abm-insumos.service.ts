import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IInsumoApiResponse, IInsumo, IInsumoSingleApiResponse, IInsumoStockHistorialApiResponse, ICreateInsumoStock } from './models/insumo.interface';
import { ITipoInsumo, ITipoInsumoApiResponse } from './models/tipo-insumo.interface';
import { IMateriaPrima, IMateriaPrimaApiResponse } from './models/materia-prima.interface';


import { TableDataService } from 'app/shared/services/table-data.service';

@Injectable({
    providedIn: 'root'
})
export class AbmInsumosService {
    private readonly apiUrl = `${environment.server}insumo`;
    private readonly tipoInsumoApiUrl = `${environment.server}tipoInsumo/soloHijos`;
    private readonly materiaPrimaApiUrl = `${environment.server}materiaPrima`;
    private readonly apiStockUrl = `${environment.server}insumoStockHistorial`;

    constructor(
        private http: HttpClient,
        private tableDataService: TableDataService
    ) { }

    getInsumos(filters: { nombre?: string; page?: number; pageSize?: number } = {}): Observable<IInsumoApiResponse> {
        let params = new HttpParams()
            .set('page', (filters.page ?? 0).toString())
            .set('pageSize', (filters.pageSize ?? 9999).toString());
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
        const params = new HttpParams()
            .set('page', '0')
            .set('pageSize', '9999');
        return this.http.get<any>(this.materiaPrimaApiUrl, { params }).pipe(
            map(response => this.tableDataService.extractItems(response)),
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