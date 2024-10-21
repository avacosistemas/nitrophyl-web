import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
// * Environment.
import { environment } from 'environments/environment';
// * Interfaces.
import {
  IAssay,
  IAssayCreate,
  IAssayCreateWithoutResults,
  IAssayDetailResponse,
  IAssayDetailsResponse,
  IAssayResponse,
  IAssaysResponse,
} from '../models/assay.interface';
import { ILot } from '../models/lot.interface';

@Injectable({
  providedIn: 'root',
})
export class AssayService {
  public drawer$: Observable<boolean>;

  private assaysSubject = new BehaviorSubject<IAssay[]>([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public assays$ = this.assaysSubject.asObservable();
  private _lot: ILot;
  private _machine: number;
  private _mode: string;
  private readonly _url: string = `${environment.server}`;
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

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public get mode(): string {
    return this._mode;
  }

  public set mode(mode: string) {
    this._mode = mode;
  }

  public get(id: number): Observable<IAssaysResponse> {
    return this.http.get<IAssaysResponse>(`${this._url}ensayo/${id}`);
  }

  public getAssay(id: number): Observable<IAssayDetailsResponse | IAssayDetailResponse> {
    return this.http.get<IAssayDetailsResponse | IAssayDetailResponse>(`${this._url}ensayoResultado/${id}`);
  }

  public post(assay: IAssayCreate): Observable<IAssayResponse> {
    return this.http.post<IAssayResponse>(`${this._url}ensayo`, assay);
  }

  public toggleDrawer(): void {
    this._drawer.next(!this._drawer.value);
  }

  public updateAssays(assays: IAssay[]): void {
    this.assaysSubject.next(assays);
  }

  public fetchAssays(id: number): void {
    this.get(id).subscribe((res) => {
      const assays = Array.isArray(res.data) ? res.data : [res.data];
      this.updateAssays(assays);
    });
  }

  postAssayWithoutResults(assayData: IAssayCreateWithoutResults): Observable<any> {
    return this.http.post(`${this._url}ensayo/sinresultados`, assayData);
  }
}
