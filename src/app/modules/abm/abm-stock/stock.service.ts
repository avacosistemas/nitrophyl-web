import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { IStockPiezaResponse, IStockMovimientoResponse } from './models/stock.model';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly baseUrl = environment.server;

  constructor(private http: HttpClient) {}

  getPiezaStock(params?: any): Observable<IStockPiezaResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<IStockPiezaResponse>(`${this.baseUrl}pieza/stock`, { params: httpParams });
  }

  getStockMovimientos(params?: any): Observable<IStockMovimientoResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<IStockMovimientoResponse>(`${this.baseUrl}pieza/stock/movimiento`, { params: httpParams });
  }
}
