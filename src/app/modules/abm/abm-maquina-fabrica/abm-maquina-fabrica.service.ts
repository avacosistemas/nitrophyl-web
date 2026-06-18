import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { IMaquinaFabricaApiResponse, IMaquinaFabricaDto, IMaquinaFabricaSingleApiResponse } from './models/maquina-fabrica.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmMaquinaFabricaService {
    private readonly apiUrl = `${environment.server}maquinaFabrica`;

    constructor(private http: HttpClient) { }

    getMaquinas(): Observable<IMaquinaFabricaApiResponse> {
        return this.http.get<IMaquinaFabricaApiResponse>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }

    getMaquinasCombo(idSector?: number, nombre?: string): Observable<IMaquinaFabricaApiResponse> {
        let params = new HttpParams();
        if (idSector) {
            params = params.set('idSector', idSector.toString());
        }
        if (nombre) {
            params = params.set('nombre', nombre);
        }
        return this.http.get<IMaquinaFabricaApiResponse>(`${this.apiUrl}/combo`, { params }).pipe(
            catchError(this.handleError)
        );
    }

    createMaquina(dto: IMaquinaFabricaDto): Observable<IMaquinaFabricaSingleApiResponse> {
        return this.http.post<IMaquinaFabricaSingleApiResponse>(this.apiUrl, dto).pipe(
            catchError(this.handleError)
        );
    }

    updateMaquina(id: number, dto: IMaquinaFabricaDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dto).pipe(
            catchError(this.handleError)
        );
    }

    deleteMaquina(id: number): Observable<any> {
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
