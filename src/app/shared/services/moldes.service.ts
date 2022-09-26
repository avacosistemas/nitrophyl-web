import { HttpClient, HttpBackend } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { Boca, CargaArchivo, Dimension, Molde, MoldeRegistro, ResponseBoca, ResponseDimension } from "../models/molde.model";
import { Perfil } from "../models/perfil.model";


@Injectable({
    providedIn: 'root'
})

export class MoldesService {

    private mode: string;

    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
    }

    public getMoldes(): Observable<any> {
        return this.http.get<any>(`${environment.server}molde/`)
    }

    public postMolde(molde: Molde): Observable<any> {
        return this.http.post<any>(`${environment.server}molde/`, molde)
    }

    public getMoldeById(id: number): Observable<any> {
        return this.http.get<any>(`${environment.server}molde/${id}`)
    }

    public updateMolde(id: number, molde: Molde): Observable<any> {
        return this.http.put<any>(`${environment.server}molde/${id}`, molde)
    }

    public getMoldeRegistro(id: number): Observable<any> {
        return this.http.get<any>(`${environment.server}molde/registro/${id}`)
    }

    public addMoldeRegistro(id: number, moldeRegistro: MoldeRegistro): Observable<any> {
        return this.http.post<any>(`${environment.server}molde/registro/${id}`, moldeRegistro)
    }

    public getMoldeBocas(id: number): Observable<ResponseBoca> {
        return this.http.get<ResponseBoca>(`${environment.server}molde/boca/${id}`)
    }

    public updateMoldeBocas(id: number, bocas: Array<Boca>): Observable<ResponseBoca> {
        return this.http.put<ResponseBoca>(`${environment.server}molde/boca/${id}`, bocas)
    }

    public getMoldeDimensiones(id: number): Observable<ResponseDimension> {
        return this.http.get<ResponseDimension>(`${environment.server}molde/dimensiones/${id}`)
    }

    public updateMoldeDimensiones(id: number, dimensiones: Array<Dimension>): Observable<ResponseDimension> {
        return this.http.put<ResponseDimension>(`${environment.server}molde/dimensiones/${id}`, dimensiones)
    }

    public getFotos(idMolde: number): Observable<any> {
        return this.http.get<any>(`${environment.server}molde/foto/${idMolde}`)
    }

    public postFoto(foto: CargaArchivo): Observable<any> {
        return this.http.post<any>(`${environment.server}molde/foto/`, foto)
    }

    public getFotoById() {

    }

    public getPlanos(idMolde: number): Observable<any> {
        return this.http.get<any>(`${environment.server}molde/plano/${idMolde}`)
    }

    public postPlano(plano: CargaArchivo): Observable<any> {
        return this.http.post<any>(`${environment.server}molde/plano/`, plano)
    }

    public getPlanoById() {

    }

    public getMode() {
        return this.mode;
    }

    public setMode(mode: string) {
        this.mode = mode;
    }
}