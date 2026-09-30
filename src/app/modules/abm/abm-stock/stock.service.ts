import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { IStockPiezaResponse, IStockMovimientoResponse } from './models/stock.model';

import { TableDataService } from 'app/shared/services/table-data.service';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly baseUrl = environment.server;

  constructor(
    private http: HttpClient,
    private tableDataService: TableDataService
  ) {}

  getPiezaStock(params?: any): Observable<IStockPiezaResponse> {
    const httpParams = this.tableDataService.buildHttpParams(params);
    return this.http.get<IStockPiezaResponse>(`${this.baseUrl}pieza/stock`, { params: httpParams });
  }

  getStockMovimientos(params?: any): Observable<IStockMovimientoResponse> {
    const httpParams = this.tableDataService.buildHttpParams(params);
    return this.http.get<IStockMovimientoResponse>(`${this.baseUrl}pieza/stock/movimiento`, { params: httpParams });
  }
}
