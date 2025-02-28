import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, throwError, map } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import {
  ILot,
  ILotResponse,
  ILotsResponse,
  ILotResponseAutocomplete,
  IInformeLoteResponse
} from 'app/shared/models/lot.interface';
import { IResponse } from '../models/response.interface';

@Injectable({
  providedIn: 'root',
})
export class LotService {
  public drawer$: Observable<boolean>;
  public drawerEdit$: Observable<boolean>;
  private readonly _apiUrl: string = `${environment.server}`;
  private readonly _apiUrlLotes: string = `${environment.server}lotes`;
  private readonly _url: string = `${environment.server}lote`;
  private readonly _urlCount: string = `${environment.server}lote/count`;
  private readonly _urlMonitor: string = `${environment.server}lote/monitor`;
  private readonly _urlCountMonitor: string = `${environment.server}lote/monitor/count`;
  private readonly _drawer: BehaviorSubject<boolean>;
  private readonly _drawerEdit: BehaviorSubject<boolean>;

  constructor(private readonly http: HttpClient, handler: HttpBackend) {
    this.http = new HttpClient(handler);
    this._drawer = new BehaviorSubject<boolean>(false);
    this.drawer$ = this._drawer.asObservable();
    this._drawerEdit = new BehaviorSubject<boolean>(false);
    this.drawerEdit$ = this._drawerEdit.asObservable();
  }

  public get(): Observable<ILotsResponse> {
    return this.http.get<ILotsResponse>(this._url + '?asc=false&idx=nroLote');
  }

  public read(id): Observable<ILotResponse> {
    return this.http.get<ILotResponse>(this._url + '/' + parseInt(id));
  }

  public getMonitor(): Observable<ILotsResponse> {
    return this.http.get<ILotsResponse>(this._urlMonitor);
  }

  public getByFilter(formula: string, lot: string, fechaDesde: string, fechaHasta: string, estado: string, rows, first, idx, asc): Observable<ILotsResponse> {
    let url = this._url + '?asc=' + asc + '&idx=' + idx + '&rows=' + rows + '&first=' + first;

    if (formula != null && formula != '') {
      url = url + '&idFormula=' + formula;
    }
    if (lot != null && lot != '') {
      url = url + '&nroLote=' + lot;
    }
    if (fechaDesde != null && fechaDesde != '') {
      url = url + '&fechaDesde=' + fechaDesde;
    }
    if (fechaHasta != null && fechaHasta != '') {
      url = url + '&fechaHasta=' + fechaHasta;
    }
    if (estado != null && estado != '') {
      url = url + '&estado=' + estado;
    }

    return this.http.get<ILotsResponse>(url);
  }

  public countByFilter(formula: string, lot: string, fechaDesde: string, fechaHasta: string, estado: string, rows, first, idx, asc): Observable<IResponse<number>> {
    let url = this._urlCount + '?asc=' + asc + '&idx=' + idx + '&rows=' + rows + '&first=' + first;

    if (formula != null && formula != '') {
      url = url + '&idFormula=' + formula;
    }

    if (lot != null && lot != '') {
      url = url + '&nroLote=' + lot;
    }

    if (fechaDesde != null && fechaDesde != '') {
      url = url + '&fechaDesde=' + fechaDesde;
    }

    if (fechaHasta != null && fechaHasta != '') {
      url = url + '&fechaHasta=' + fechaHasta;
    }

    if (estado != null && estado != '') {
      url = url + '&estado=' + estado;
    }

    return this.http.get<IResponse<number>>(url);
  }
  public put(lot: ILot): Observable<ILotResponse> {
    return this.http.put<ILotResponse>(this._url + '/update/' + lot.id, lot);
  }

  public post(lot: ILot): Observable<ILotResponse> {
    return this.http.post<ILotResponse>(this._url, lot);
  }

  public approve(
    id: number,
    body: { estado: string; observaciones: string; fecha: string }
  ): Observable<ILotResponse> {
    return this.http.put<ILotResponse>(`${this._url}/aprobar/${id}`, body);
  }

  public reject(id: number, observaciones: string, fecha: string): Observable<ILotResponse> {
    return this.http.put<ILotResponse>(`${this._url}/rechazar/${id}`, {
      observaciones, fecha
    });
  }

  public toggleDrawer(): void {
    this._drawer.next(!this._drawer.value);
  }

  public delete(id: number): Observable<ILotResponse> {
    return this.http.delete<ILotResponse>(`${this._url}/delete/${id}`);
  }

  public toggleDrawerEdit(): void {
    this._drawerEdit.next(!this._drawerEdit.value);
  }

  getLotes(): Observable<ILotResponseAutocomplete> {
    return this.http.get<ILotResponseAutocomplete>(`${this._apiUrlLotes}/autocomplete`);
  }

  getInformeLote(id: string): Observable<IInformeLoteResponse> {
    return this.http.get<IInformeLoteResponse>(`${this._url}/${id}`);
  }

  getLotesByNroLote(nroLote: string): Observable<ILotResponseAutocomplete> {
    const url = `${this._apiUrlLotes}/autocomplete?estados=APROBADO&estados=APROBADO_OBSERVADO&nroLote=${nroLote}`;
    return this.http.get<ILotResponseAutocomplete>(url);
  }

  getInformeCalidad(idCliente: number, idLote: string): Observable<any> {
    const params = new HttpParams()
      .set('idCliente', idCliente)
      .set('idLote', idLote);

    const url = `${this._apiUrl}loteReporte`;

    return this.http.get<any>(url, { params }).pipe(
      catchError((error) => {
        console.error('Error al enviar el informe', error);
        return throwError(error);
      })
    );
  }

  public getByFilterMonitor(formula: string, lot: string, fechaDesde: string, fechaHasta: string, rows, first, idx, asc): Observable<ILotsResponse> {
    var url = this._url + "?asc=" + asc + "&idx=" + idx + "&rows=" + rows + "&first=" + first;

    if (formula != null && formula != "") {
      url = url + "&idFormula=" + formula;
    }
    if (lot != null && lot != "") {
      url = url + "&nroLote=" + lot;
    }
    if (fechaDesde != null && fechaDesde != "") {
      url = url + "&fechaDesde=" + fechaDesde;
    }
    if (fechaHasta != null && fechaHasta != "") {
      url = url + "&fechaHasta=" + fechaHasta;
    }

    return this.http.get<ILotsResponse>(url);
  }

  public countByFilterMonitor(formula: string, lot: string, fechaDesde: string, fechaHasta: string, rows, first, idx, asc): Observable<IResponse<number>> {
    let url = this._urlCountMonitor + '?asc=' + asc + '&idx=' + idx + '&rows=' + rows + '&first=' + first;

    if (formula != null && formula != '') {
      url = url + '&idFormula=' + formula;
    }

    if (lot != null && lot != '') {
      url = url + '&nroLote=' + lot;
    }

    if (fechaDesde != null && fechaDesde != '') {
      url = url + '&fechaDesde=' + fechaDesde;
    }

    if (fechaHasta != null && fechaHasta != '') {
      url = url + '&fechaHasta=' + fechaHasta;
    }

    return this.http.get<IResponse<number>>(url);
  }

  enviarInformePorCorreo(idCliente: number, idLote: string): Observable<any> {
    const params = new HttpParams()
      .set('idCliente', idCliente)
      .set('idLote', idLote);

    const url = `${this._apiUrl}loteReporte/enviar`;
    return this.http.get<any>(url, { params });
  }

  uploadGrafico(idLote: number, archivo: string): Observable<any> {
    const url = `${this._url}/grafico`;
    const body = {
      idLote: idLote,
      archivo: archivo
    };
    return this.http.post(url, body);
  }

  downloadGrafico(idLote: number): Observable<string> {
    const url = `${environment.server}lote/grafico?idLote=${idLote}`;
    return this.http.get(url, { responseType: 'text' })
      .pipe(
        map((response: string) => {
          const jsonResponse = JSON.parse(response);
          return jsonResponse.data.archivo;
        })
      );
  }
}
