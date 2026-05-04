import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
@Injectable({
    providedIn: 'root'
})
export class AbmTransportesService {
    private readonly apiUrl = `${environment.server}empresaTransporte`;

    constructor(private http: HttpClient) { }

    getTransportes(params: any = {}): Observable<any> {
        let httpParams = new HttpParams();
        if (params.asc !== undefined) httpParams = httpParams.set('asc', params.asc.toString());
        if (params.direccion) httpParams = httpParams.set('direccion', params.direccion);
        if (params.first !== undefined) httpParams = httpParams.set('first', params.first.toString());
        if (params.idx) httpParams = httpParams.set('idx', params.idx);
        if (params.nombre) httpParams = httpParams.set('nombre', params.nombre);
        if (params.rows) httpParams = httpParams.set('rows', params.rows.toString());
        if (params.mediosEnvio) {
            params.mediosEnvio.forEach(m => {
                httpParams = httpParams.append('mediosEnvio', m);
            });
        }

        return this.http.get<any>(this.apiUrl, { params: httpParams });
    }

    createTransporte(dto: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, dto);
    }

    updateTransporte(id: number, dto: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
    }

    deleteTransporte(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
