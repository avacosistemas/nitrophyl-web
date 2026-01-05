import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'environments/environment';
import { IOrdenCompraApiResponse, IOrdenCompraCreateDTO } from './models/orden-compra.interface';

@Injectable({
    providedIn: 'root'
})
export class AbmOrdenCompraService {
    private readonly apiUrl = `${environment.server}ordenCompra`;

    private _headerButtons = new BehaviorSubject<any[]>([]);
    headerButtons$ = this._headerButtons.asObservable();

    private _headerSubtitle = new BehaviorSubject<string>('');
    headerSubtitle$ = this._headerSubtitle.asObservable();

    private _actionTriggered = new Subject<string>();
    actionTriggered$ = this._actionTriggered.asObservable();

    constructor(private http: HttpClient) { }

    updateHeaderButtons(buttons: any[]): void { this._headerButtons.next(buttons); }
    updateHeaderSubtitle(subtitle: string): void { this._headerSubtitle.next(subtitle); }
    triggerAction(action: string): void { this._actionTriggered.next(action); }

    getOrdenesCompra(params: any): Observable<IOrdenCompraApiResponse> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return this.http.get<IOrdenCompraApiResponse>(this.apiUrl, { params: httpParams });
    }

    createOrdenCompra(dto: IOrdenCompraCreateDTO): Observable<any> {
        return this.http.post<any>(this.apiUrl, dto);
    }

    downloadArchivo(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/archivo/${id}`);
    }

    getPiezas(idCliente?: number | null, soloDelCliente: boolean = true): Observable<any> {
        let params = new HttpParams().set('soloDelCliente', soloDelCliente.toString());
        if (idCliente) params = params.set('idCliente', idCliente.toString());
        return this.http.get<any>(`${environment.server}piezas/paraFabricacion`, { params });
    }

    getPiezaCotizacion(idPieza: number, idCliente: number | null): Observable<any> {
        return this.http.get<any>(`${environment.server}piezas/cotizacion/${idPieza}/${idCliente}`);
    }
}