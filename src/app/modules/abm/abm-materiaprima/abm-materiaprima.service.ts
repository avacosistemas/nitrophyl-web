import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IMateriaPrimaApiResponse, IMateriaPrima, IMateriaPrimaSingleApiResponse, ICreateMateriaPrimaStock, IMateriaPrimaStockHistorialApiResponse } from './models/materia-prima.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmMateriaPrimaService {
    private readonly apiUrl = `${environment.server}materiaPrima`;
    private readonly apiStockUrl = `${environment.server}materiaPrimaStockHistorial`;

    constructor(private http: HttpClient) { }

    getMateriasPrimas(filters: { nombre?: string } = {}): Observable<IMateriaPrimaApiResponse> {
        let params = new HttpParams();
        if (filters.nombre) {
            params = params.set('nombre', filters.nombre);
        }
        return this.http.get<IMateriaPrimaApiResponse>(this.apiUrl, { params });
    }

    createMateriaPrima(dto: Partial<IMateriaPrima>): Observable<IMateriaPrimaSingleApiResponse> {
        const { id, cantidadStock, ...materiaPrimaData } = dto;
        return this.http.post<IMateriaPrimaSingleApiResponse>(this.apiUrl, materiaPrimaData);
    }

    updateMateriaPrima(id: number, dto: Partial<IMateriaPrima>): Observable<any> {
        const { cantidadStock, ...materiaPrimaData } = dto;
        return this.http.put(`${this.apiUrl}/${id}`, materiaPrimaData);
    }

    deleteMateriaPrima(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            catchError((error: HttpErrorResponse) => {
                return throwError(() => error);
            })
        );
    }

    getMateriaPrimaStockHistorial(idMateriaPrima: number): Observable<IMateriaPrimaStockHistorialApiResponse> {
        const params = new HttpParams().set('sort', 'fecha,desc');
        return this.http.get<IMateriaPrimaStockHistorialApiResponse>(`${this.apiStockUrl}/${idMateriaPrima}`, { params });
    }

    createMateriaPrimaStock(dto: ICreateMateriaPrimaStock): Observable<any> {
        return this.http.post(this.apiStockUrl, dto);
    }
}