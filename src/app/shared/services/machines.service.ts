import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter,  } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import { IMachineResponse, IMachine } from '../models/machine.model';
import { ILotePorMaquinaReporteParams, LotePorMaquinaResponse } from '../models/lote-por-maquina-reporte.model';
import { MaquinaPruebaResponse } from '../models/maquina-prueba.model';

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  private selectedMachine: IMachine | null = null;
  private url: string = `${environment.server}maquina`;
  private lotePorMaquinaUrl: string = `${environment.server}lotePorMaquinaReporte`;
  private maquinaPruebaUrl: string = `${environment.server}maquina/prueba`;

  private mode: string = '';

  constructor(private http: HttpClient) {
  }

  // ! Para obtener la grilla invocar /maquina?nombre=xxx&estado=xxxx por GET
  // ! Para obtener los datos de una maquina /maquina/{id} por GET
  public get(body?: IMachine): Observable<IMachineResponse> {
    let url: string;

    if (!body) { return this.http.get<IMachineResponse>(`${this.url}s`); }

    if (body.id) { return this.http.get<IMachineResponse>(`${this.url}/${body.id}`); }

    if (body.nombre && body.estado) {
      url = `${this.url}?nombre=${body.nombre}&estado=${body.estado}`;
    } else {
      if (body.nombre) { url = `${this.url}?nombre=${body.nombre}`; }
      if (body.estado) { url = `${this.url}?estado=${body.estado}`; }
    }

    return this.http.get<IMachineResponse>(`${url}`);
  }

  // ! Para grabar una nueva maquina /maquina por POST enviando nombre y estado
  public post(body: IMachine): Observable<IMachineResponse> {
    return this.http.post<IMachineResponse>(`${this.url}`, body);
  }

  // ! Para actualizar una maquina /maquina/{idMaquina} PUT enviando nombre y estado
  public put(body: IMachine): Observable<IMachineResponse> {
    return this.http.put<IMachineResponse>(`${this.url}/${body.id}`, body);
  }

  public updateMachineOrder(machines: IMachine[]): Observable<any> {
    const requests = machines.map(machine =>
      this.http.put<any>(`${this.url}/${machine.id}`, machine)
    );
    return forkJoin(requests).pipe(
      map(responses => ({
        status: 'OK',
        data: responses.map(response => response.data),
      }))
    );
  }

  public getMode(): string {
    return this.mode;
  }

  public setMode(mode: string): void {
    this.mode = mode;
  }

  public setSelectedMachine(machine: IMachine): void {
    this.selectedMachine = machine;
  }

  public getSelectedMachine(): IMachine | null {
    return this.selectedMachine;
  }

  public getLotesPorMaquina(params: ILotePorMaquinaReporteParams): Observable<LotePorMaquinaResponse> {
    let httpParams = new HttpParams();

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.append(key, params[key]?.toString());
    }
    });

    return this.http.get<LotePorMaquinaResponse>(this.lotePorMaquinaUrl, { params: httpParams });
  }

  public getPruebasPorMaquina(idMaquina: number): Observable<MaquinaPruebaResponse> {
    return this.http.get<MaquinaPruebaResponse>(`${this.maquinaPruebaUrl}/${idMaquina}`);
  }
}