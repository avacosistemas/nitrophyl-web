import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { environment } from 'environments/environment';
import { IOrdenFabricacionCreateDTO } from './models/orden-fabricacion.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmOrdenFabricacionService {
    private readonly apiUrl = `${environment.server}ordenFabricacion`;

    private _headerButtons = new BehaviorSubject<any[]>([]);
    headerButtons$ = this._headerButtons.asObservable();

    private _headerSubtitle = new BehaviorSubject<string>('');
    headerSubtitle$ = this._headerSubtitle.asObservable();

    private _actionTriggered = new Subject<string>();
    actionTriggered$ = this._actionTriggered.asObservable();

    constructor(private http: HttpClient) { }

    updateHeaderButtons(buttons: any[]): void {
        this._headerButtons.next(buttons);
    }

    updateHeaderSubtitle(subtitle: string): void {
        this._headerSubtitle.next(subtitle);
    }

    triggerAction(action: string): void {
        this._actionTriggered.next(action);
    }

    getOrdenesFabricacion(params: any): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return this.http.get<any>(this.apiUrl, { params: httpParams });
    }

    createOrdenFabricacion(dto: IOrdenFabricacionCreateDTO): Observable<any> {
        return this.http.post<any>(this.apiUrl, dto);
    }

    getOrdenesCompraPorCliente(idCliente: number): Observable<any> {
        return this.http.get<any>(`${environment.server}ordenesCompra/porCliente/${idCliente}`);
    }

    getPiezas(idCliente?: number | null, soloDelCliente: boolean = true): Observable<any> {
        let params = new HttpParams().set('soloDelCliente', soloDelCliente.toString());
        if (idCliente) params = params.set('idCliente', idCliente.toString());
        return this.http.get<any>(`${environment.server}piezas/paraFabricacion`, { params });
    }

    // getPiezaStock(idPieza: number): Observable<any> {
    //     return this.http.get<any>(`${environment.server}piezas/stock/${idPieza}`);
    // }

    getPiezaStock(idPieza: number): Observable<any> {
        return of({
            status: 'OK',
            data: {
                idPieza: idPieza,
                stock: 22 
            }
        });
    }

    getPiezaCotizacion(idPieza: number, idCliente: number | null): Observable<any> {
        if (idCliente === null) return of({ data: { tieneCotizacion: true, valor: 0, fecha: null } });
        return this.http.get<any>(`${environment.server}piezas/cotizacion/${idPieza}/${idCliente}`);
    }
}