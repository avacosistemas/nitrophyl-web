import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { IOrdenCompraApiResponse, IOrdenCompraCreateDTO, IOrdenCompraSingleApiResponse } from './models/orden-compra.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmOrdenCompraService {
    private readonly apiUrl = `${environment.server}ordenCompra`;

    constructor(private http: HttpClient) { }

    getOrdenesCompra(params: any): Observable<IOrdenCompraApiResponse> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return this.http.get<IOrdenCompraApiResponse>(this.apiUrl, { params: httpParams });
    }

    createOrdenCompra(dto: IOrdenCompraCreateDTO): Observable<IOrdenCompraSingleApiResponse> {
        return this.http.post<IOrdenCompraSingleApiResponse>(this.apiUrl, dto);
    }

    downloadArchivo(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/archivo/${id}`);
    }
}