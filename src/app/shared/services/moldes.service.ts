import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Boca,
  CargaArchivo,
  Dimension,
  Molde,
  MoldeRegistro,
  ResponseBoca,
  ResponseDimension,
} from '../models/molde.model';
import { Observacion } from '../models/observacion.model';

@Injectable({
  providedIn: 'root',
})
export class MoldesService {
  private url: string = `${environment.server}`;
  private mode: string;

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public getMoldes(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${environment.server}molde`, { params: httpParams });
  }

  public postMolde(molde: Molde): Observable<any> {
    return this.http.post<any>(`${environment.server}molde/`, molde);
  }

  public getMoldeById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.server}molde/${id}`);
  }

  public updateMolde(id: number, molde: Molde): Observable<any> {
    return this.http.put<any>(`${environment.server}molde/${id}`, molde);
  }

  public getMoldeRegistro(id: number): Observable<any> {
    return this.http.get<any>(`${environment.server}molde/registro/${id}`);
  }

  public addMoldeRegistro(
    id: number,
    moldeRegistro: MoldeRegistro
  ): Observable<any> {
    return this.http.post<any>(
      `${environment.server}molde/registro/${id}`,
      moldeRegistro
    );
  }

  public getMoldeBocas(id: number): Observable<ResponseBoca> {
    return this.http.get<ResponseBoca>(`${environment.server}molde/boca/${id}`);
  }

  public updateMoldeBocas(
    id: number,
    bocas: Array<Boca>
  ): Observable<ResponseBoca> {
    return this.http.put<ResponseBoca>(
      `${environment.server}molde/boca/${id}`,
      bocas
    );
  }

  public getMoldeDimensiones(id: number): Observable<ResponseDimension> {
    return this.http.get<ResponseDimension>(
      `${environment.server}molde/dimensiones/${id}`
    );
  }

  public updateMoldeDimensiones(
    id: number,
    dimensiones: Array<Dimension>
  ): Observable<ResponseDimension> {
    return this.http.put<ResponseDimension>(
      `${environment.server}molde/dimensiones/${id}`,
      dimensiones
    );
  }

  public getFotos(idMolde: number): Observable<any> {
    return this.http.get<any>(`${environment.server}molde/foto/${idMolde}`);
  }

  public postFoto(foto: CargaArchivo): Observable<any> {
    return this.http.post<any>(`${environment.server}molde/foto/`, foto);
  }

  downloadFoto(idMoldeFoto: number): Observable<any> {
    return this.http.post<any>(
      `${environment.server}molde/foto/descargar/${idMoldeFoto}`,
      null,
    );
  }

  public getPlanos(idMolde: number): Observable<any> {
    return this.http.get<any>(`${environment.server}molde/plano/${idMolde}`);
  }

  public postPlano(plano: CargaArchivo): Observable<any> {
    return this.http.post<any>(`${environment.server}molde/plano/`, plano);
  }

  public downloadPlano(idMoldePlano: number): Observable<any> {
    return this.http.post<any>(
      `${environment.server}molde/plano/descargar/${idMoldePlano}`,
      null
    );
  }

  getFotoBlob(idFoto: number): Observable<Blob> {
    return this.http.get<any>(`${environment.server}/molde/foto/descargar/${idFoto}`)
      .pipe(
        map(response => {
          const byteCharacters = atob(response.data.archivo);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          return blob;
        })
      );
  }

  public getMode() {
    return this.mode;
  }

  public setMode(mode: string) {
    this.mode = mode;
  }

  public getClients(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}molde/clientes/${id}`);
  }

  public putClient(id: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.url}molde/clientes/${id}`, body);
  }

  public postObservacion(observacion: Observacion): Observable<any> {
    return this.http.post<any>(`${this.url}molde/observacion/`, observacion);
  }

  public getObservaciones(idMolde: number): Observable<any> {
    return this.http.get<any>(`${this.url}molde/observacion/${idMolde}`);
  }
}