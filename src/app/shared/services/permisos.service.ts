import { HttpClient, HttpBackend } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { Permiso, RespuestaPermiso, RespuestaPermisos } from "../models/permiso.model";
import { Respuesta } from "../models/respuesta.model";


@Injectable({
    providedIn: 'root'
})

export class PermisosService {

    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
    }

    public getPermisos(): Observable<RespuestaPermisos> {
        return this.http.get<RespuestaPermisos>(`${environment.server}permissions/`)
    }

    public postPermiso(permiso: Permiso): Observable<any> {
        return this.http.post<any>(`${environment.server}permissions/`, permiso)
    }

    public getPermisoById(id: number): Observable<RespuestaPermiso> {
        return this.http.get<RespuestaPermiso>(`${environment.server}permissions/${id}`)
    }

    public updatePermiso(id: number, permiso: Permiso): Observable<any> {
        return this.http.put<any>(`${environment.server}permissions/${id}`, permiso)
    }

    public deletePermiso(id: number): Observable<Respuesta> {
        return this.http.delete<Respuesta>(`${environment.server}permissions/${id}`)
    }
}