import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import {
  ILot,
  ILotResponse,
  ILotsResponse,
} from 'app/shared/models/lot.interface';
import { IResponse } from '../models/response.interface';

@Injectable({
  providedIn: 'root',
})
export class LotService {
  public drawer$: Observable<boolean>;
  private readonly _url: string = `${environment.server}lote`;
  private readonly _urlCount: string = `${environment.server}lote/count`;
  private readonly _urlMonitor: string = `${environment.server}lote/monitor`;
  private readonly _drawer: BehaviorSubject<boolean>;

  constructor(private readonly http: HttpClient, handler: HttpBackend) {
    this.http = new HttpClient(handler);
    this._drawer = new BehaviorSubject<boolean>(false);
    this.drawer$ = this._drawer.asObservable();
  }

  public get(): Observable<ILotsResponse> {
    return this.http.get<ILotsResponse>(this._url + "?asc=false&idx=nroLote");
  }

public getMonitor(): Observable<ILotsResponse> {
    return this.http.get<ILotsResponse>(this._urlMonitor);
  }

  public getByFilter(formula: string, lot: string, fechaDesde: string, fechaHasta:string, estado:string, rows, first, idx, asc): Observable<ILotsResponse> {
    var url = this._url + "?asc="+ asc + "&idx=" + idx + "&rows=" + rows + "&first=" + first;

    if (formula != null && formula != "") {
      url = url + "&idFormula="+formula;
    }
    if (lot != null && lot != "") {
      url = url + "&nroLote="+lot;
    }
    if (fechaDesde != null && fechaDesde != "") {
      url = url + "&fechaDesde="+fechaDesde;
    }
    if (fechaHasta != null && fechaHasta != "") {
      url = url + "&fechaHasta="+fechaHasta;
    }
    if (estado != null && estado != "") {
      url = url + "&estado="+estado;
    }

    return this.http.get<ILotsResponse>(url);
  }

  public countByFilter(formula: string, lot: string, fechaDesde: string, fechaHasta:string, estado:string, rows, first, idx, asc): Observable<IResponse<number>> {
    var url = this._urlCount + "?asc="+ asc + "&idx=" + idx + "&rows=" + rows + "&first=" + first;

    if (formula != null && formula != "") {
      url = url + "&idFormula="+formula;
    }
    if (lot != null && lot != "") {
      url = url + "&nroLote="+lot;
    }
    if (fechaDesde != null && fechaDesde != "") {
      url = url + "&fechaDesde="+fechaDesde;
    }
    if (fechaHasta != null && fechaHasta != "") {
      url = url + "&fechaHasta="+fechaHasta;
    }
    if (estado != null && estado != "") {
      url = url + "&estado="+estado;
    }

    return this.http.get<IResponse<number>>(url);
  }

  public post(lot: ILot): Observable<IResponse<number>> {
    return this.http.post<IResponse<number>>(this._url, lot);
  }

  public approve(
    id: number,
    body: { estado: string; observaciones: string }
  ): Observable<ILotResponse> {
    return this.http.put<ILotResponse>(`${this._url}/aprobar/${id}`, body);
  }

  public reject(id: number, observaciones: string): Observable<ILotResponse> {
    return this.http.put<ILotResponse>(`${this._url}/rechazar/${id}`, {
      observaciones,
    });
  }

  public toggleDrawer(): void {
    this._drawer.next(!this._drawer.value);
  }
}
