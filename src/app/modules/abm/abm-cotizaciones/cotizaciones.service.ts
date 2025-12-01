import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ICotizacionApiResponse, ICotizacionCreateDTO } from './models/cotizacion.model';

@Injectable({
    providedIn: 'root'
})
export class CotizacionesService {

    private readonly apiUrl = `${environment.server}cotizacion`;

    constructor(private http: HttpClient) { }

    getCotizaciones(params: any): Observable<ICotizacionApiResponse> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return this.http.get<ICotizacionApiResponse>(this.apiUrl, { params: httpParams });
    }

    getPiezasCliente(idCliente: number): Observable<any> {
        const params = new HttpParams().set('idCliente', idCliente.toString());
        return this.http.get<any>(`${environment.server}piezaCliente`, { params });
    }

    createCotizacion(dto: ICotizacionCreateDTO): Observable<any> {
        return this.http.post(this.apiUrl, dto);
    }
}