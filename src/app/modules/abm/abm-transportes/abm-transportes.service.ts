import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { TableDataService } from 'app/shared/services/table-data.service';

@Injectable({
    providedIn: 'root'
})
export class AbmTransportesService {
    private readonly apiUrl = `${environment.server}empresaTransporte`;

    constructor(
        private http: HttpClient,
        private tableDataService: TableDataService
    ) { }

    getTransportes(params: any = {}): Observable<any> {
        const fullParams = {
            page: 0,
            pageSize: 9999,
            ...params
        };
        const httpParams = this.tableDataService.buildHttpParams(fullParams);
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
