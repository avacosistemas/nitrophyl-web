import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { ISectorFabricaApiResponse, ISectorFabricaDto, ISectorFabricaSingleApiResponse } from './models/sector-fabrica.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmSectorFabricaService {
    private readonly apiUrl = `${environment.server}sectorFabrica`;

    constructor(private http: HttpClient) { }

    getSectores(): Observable<ISectorFabricaApiResponse> {
        return this.http.get<ISectorFabricaApiResponse>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }

    getSectoresCombo(nombre?: string): Observable<ISectorFabricaApiResponse> {
        let params = new HttpParams();
        if (nombre) {
            params = params.set('nombre', nombre);
        }
        return this.http.get<any>(`${this.apiUrl}/combo`, { params }).pipe(
            map(response => ({
                ...response,
                data: (response.data || []).map((item: any) => ({
                    id: Number(item.codigo),
                    nombre: item.nombre
                }))
            })),
            catchError(this.handleError)
        );
    }

    createSector(dto: ISectorFabricaDto): Observable<ISectorFabricaSingleApiResponse> {
        return this.http.post<ISectorFabricaSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updateSector(id: number, dto: ISectorFabricaDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deleteSector(id: number): Observable<any> {
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
