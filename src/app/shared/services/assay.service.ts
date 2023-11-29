import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import {
  IAssay,
  IAssayCreate,
  IAssayResponse,
  IAssaysResponse,
} from '../models/assay.interface';
import { ILot } from '../models/lot.interface';

@Injectable({
  providedIn: 'root',
})
export class AssayService {
  public drawer$: Observable<boolean>;

  private _lot: ILot;
  private _machine: number;
  private readonly _url: string = `${environment.server}ensayo`;
  private readonly _drawer: BehaviorSubject<boolean>;

  constructor(private readonly http: HttpClient, handler: HttpBackend) {
    this.http = new HttpClient(handler);
    this._drawer = new BehaviorSubject<boolean>(false);
    this.drawer$ = this._drawer.asObservable();
  }

  public get machine(): number {
    return this._machine;
  }

  public set machine(id: number) {
    this._machine = id;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public get lot(): ILot {
    return this._lot;
  }

  public set lot(lot: ILot) {
    this._lot = lot;
  }

  public get(id: number): Observable<IAssaysResponse> {
    return this.http.get<IAssaysResponse>(`${this._url}/${id}`);
  }

  public post(assay: IAssayCreate): Observable<IAssayResponse> {
    return this.http.post<IAssayResponse>(this._url, assay);
  }

  public toggleDrawer(): void {
    this._drawer.next(!this._drawer.value);
  }
}
