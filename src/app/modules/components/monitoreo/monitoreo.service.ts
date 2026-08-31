import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface MaquinaMonitoreo {
    id?: number;
    idMaquina?: number;
    maquina: string;
    cantidad: number;
    idSector?: number;
    sector?: string;
    idTipoMaquina?: number;
    tipoMaquina?: string;
}

export interface OrdenTrabajoDetalle {
    id: number;
    idMaquina?: number;
    of: string;
    cliente: string;
    pieza: string;
    material: string;
    cantidad: number;
    fechaEntrega: string;
    posicion: number;
}

@Injectable({
    providedIn: 'root'
})
export class MonitoreoService {

    constructor(private http: HttpClient) { }

    getMaquinasMonitoreo(): Observable<any> {
        return this.http.get<any>(`${environment.server}monitorFabrica/resumenOTMaquinaSector`);
    }

    getOtsPorMaquina(idMaquina?: number | string, idSector?: number | string): Observable<any> {
        let params = new HttpParams();
        if (idMaquina !== null && idMaquina !== undefined) {
            params = params.set('idMaquina', idMaquina.toString());
        }
        if (idSector !== null && idSector !== undefined) {
            params = params.set('idSector', idSector.toString());
        }
        return this.http.get<any>(`${environment.server}monitorFabrica/detalleOTMaquinaSector`, { params });
    }
    
    actualizarPosicionOt(idOrdenFabricacion: number, nuevaPosicion: number): Observable<any> {
        let params = new HttpParams().set('nuevaPosicion', nuevaPosicion.toString());
        return this.http.get<any>(`${environment.server}ordenFabricacion/reordenar/${idOrdenFabricacion}`, { params });
    }
}
