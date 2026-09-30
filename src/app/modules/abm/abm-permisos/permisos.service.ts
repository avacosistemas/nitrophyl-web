import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { Permiso, RespuestaPermiso, RespuestaPermisos } from "./permiso.model";
import { Respuesta } from "../../../shared/models/respuesta.model";


@Injectable({
    providedIn: 'root'
})

export class PermisosService {

    private mode: string;

    constructor(
        private http: HttpClient) {
    }

    public getPermisos(): Observable<RespuestaPermisos> {
        return this.http.get<RespuestaPermisos>(`${environment.server}permissions`)
    }

    public postPermiso(permiso: Permiso): Observable<any> {
        return this.http.post<any>(`${environment.server}permissions`, permiso)
    }

    public getPermisoById(id: number): Observable<RespuestaPermiso> {
        return this.http.get<RespuestaPermiso>(`${environment.server}permissions/${id}`)
    }

    public updatePermiso(permiso: Permiso): Observable<any> {
        return this.http.put<any>(`${environment.server}permissions`, permiso)
    }

    public deletePermiso(id: number): Observable<Respuesta> {
        return this.http.delete<Respuesta>(`${environment.server}permissions/${id}`)
    }

    public filterPermisoByNombre(name: string): Observable<RespuestaPermisos> {
        return this.http.get<RespuestaPermisos>(`${environment.server}permissions/filterPermisoByNombre?name=${encodeURIComponent(name)}`)
    }

    public getMode() {
        return this.mode;
    }

    public setMode(mode: string) {
        this.mode = mode;
    }
}