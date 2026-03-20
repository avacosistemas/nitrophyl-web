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

    private _headerTitle = new BehaviorSubject<string>('');
    headerTitle$ = this._headerTitle.asObservable();

    private _headerBreadcrumbs = new BehaviorSubject<any[]>([]);
    headerBreadcrumbs$ = this._headerBreadcrumbs.asObservable();

    private _actionTriggered = new Subject<string>();
    actionTriggered$ = this._actionTriggered.asObservable();

    constructor(private http: HttpClient) { }

    updateHeaderButtons(buttons: any[]): void { this._headerButtons.next(buttons); }
    updateHeaderSubtitle(subtitle: string): void { this._headerSubtitle.next(subtitle); }
    updateHeaderTitle(title: string): void { this._headerTitle.next(title); }
    updateHeaderBreadcrumbs(breadcrumbs: any[]): void { this._headerBreadcrumbs.next(breadcrumbs); }
    triggerAction(action: string): void { this._actionTriggered.next(action); }

    getOrdenesCompra(params: any): Observable<IOrdenCompraApiResponse> {
        let httpParams = new HttpParams();
        if (params.asc !== undefined) httpParams = httpParams.set('asc', params.asc.toString());
        if (params.comprobante) httpParams = httpParams.set('comprobante', params.comprobante);
        if (params.estado) httpParams = httpParams.set('estado', params.estado);
        if (params.fechaDesde) httpParams = httpParams.set('fechaDesde', params.fechaDesde);
        if (params.fechaHasta) httpParams = httpParams.set('fechaHasta', params.fechaHasta);
        if (params.first !== undefined) httpParams = httpParams.set('first', params.first.toString());
        if (params.idCliente) httpParams = httpParams.set('idCliente', params.idCliente.toString());
        if (params.idx) httpParams = httpParams.set('idx', params.idx);
        if (params.rows) httpParams = httpParams.set('rows', params.rows.toString());

        return this.http.get<IOrdenCompraApiResponse>(this.apiUrl, { params: httpParams });
    }

    getOrdenCompra(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    createOrdenCompra(dto: IOrdenCompraCreateDTO): Observable<any> {
        return this.http.post<any>(this.apiUrl, dto);
    }

    createOrdenCompraDetalle(dto: any): Observable<any> {
        return this.http.post<any>(`${environment.server}ordenCompraDetalle`, dto);
    }

    updateOrdenCompraDetalle(id: number, dto: any): Observable<any> {
        return this.http.put<any>(`${environment.server}ordenCompraDetalle/${id}`, dto);
    }

    deleteOrdenCompraDetalle(id: number): Observable<any> {
        return this.http.delete<any>(`${environment.server}ordenCompraDetalle/${id}`);
    }

    createOrdenCompraDetallePedido(dto: any): Observable<any> {
        return this.http.post<any>(`${environment.server}ordenCompraDetallePedido`, dto);
    }

    updateOrdenCompraDetallePedido(id: number, dto: any): Observable<any> {
        return this.http.put<any>(`${environment.server}ordenCompraDetallePedido/${id}`, dto);
    }

    deleteOrdenCompraDetallePedido(id: number): Observable<any> {
        return this.http.delete<any>(`${environment.server}ordenCompraDetallePedido/${id}`);
    }
    
    getPiezas(idCliente?: number | null, soloDelCliente: boolean = true): Observable<any> {
        let params = new HttpParams().set('soloDelCliente', soloDelCliente.toString());
        if (idCliente) params = params.set('idCliente', idCliente.toString());
        return this.http.get<any>(`${environment.server}piezas/paraFabricacion`, { params });
    }

    getPiezaCotizacion(idPieza: number, idCliente: number | null): Observable<any> {
        return this.http.get<any>(`${environment.server}piezas/cotizacion/${idPieza}/${idCliente}`);
    }

    getPiezasCombo(idCliente?: number | null, nombre?: string): Observable<any> {
        let params = new HttpParams();
        if (idCliente) params = params.set('idCliente', idCliente.toString());
        if (nombre) params = params.set('nombre', nombre);

        return this.http.get<any>(`${environment.server}pieza/combo`, { params });
    }

    getCotizaciones(idPieza: number, idCliente: number): Observable<any> {
        const params = new HttpParams()
            .set('idCliente', idCliente.toString())
            .set('idPieza', idPieza.toString())
            .set('soloVigentes', 'true');

        return this.http.get<any>(`${environment.server}cotizacion`, { params });
    }

    getArchivoOrdenCompra(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}Archivo/${id}`);
    }
}