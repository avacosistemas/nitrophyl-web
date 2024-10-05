import { HttpClient, HttpBackend } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import { IMachineResponse, IMachine } from '../models/machine.model';

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private url: string = `${environment.server}maquina`;
  private mode: string = '';

  public events = new EventEmitter<any>();
  public viewEvents = new EventEmitter<any>();

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  // ! Para obtener la grilla invocar /maquina?nombre=xxx&estado=xxxx por GET
  // ! Para obtener los datos de una maquina /maquina/{id} por GET
  public get(body?: IMachine): Observable<IMachineResponse> {
    let url: string;

    if (!body) return this.http.get<IMachineResponse>(`${this.url}s`);

    if (body.id)
      return this.http.get<IMachineResponse>(`${this.url}/${body.id}`);

    if (body.nombre && body.estado) {
      url = `${this.url}?nombre=${body.nombre}&estado=${body.estado}`;
    } else {
      if (body.nombre) url = `${this.url}?nombre=${body.nombre}`;
      if (body.estado) url = `${this.url}?estado=${body.estado}`;
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

  public getTest(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/prueba/${id}`);
  }

  public setTest(body: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}/prueba/${body.idMaquina}`,
      body.moldeClientesListadoDTOs
    );
  }

  public getMode() {
    return this.mode;
  }

  public setMode(mode: string) {
    this.mode = mode;
  }
}
