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

@Injectable({
  providedIn: 'root',
})
export class LotService {
  public drawer$: Observable<boolean>;
  private readonly _url: string = `${environment.server}lote`;
  private readonly _drawer: BehaviorSubject<boolean>;

  constructor(private readonly http: HttpClient, handler: HttpBackend) {
    this.http = new HttpClient(handler);
    this._drawer = new BehaviorSubject<boolean>(false);
    this.drawer$ = this._drawer.asObservable();
  }

  public get(): Observable<ILotsResponse> {
    return this.http.get<ILotsResponse>(this._url + "?asc=false&idx=nroLote");
  }

  public post(lot: ILot): Observable<ILotResponse> {
    return this.http.post<ILotResponse>(this._url, lot);
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
