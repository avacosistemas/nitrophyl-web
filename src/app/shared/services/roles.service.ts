import { HttpBackend, HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Respuesta } from "../../shared/models/respuesta.model";
import { environment } from "environments/environment";
import { Injectable } from "@angular/core";
import { Rol, Roles, RolRespuesta } from "../models/rol.model";

@Injectable({
    providedIn: 'root'
})

export class RolesService {
    
    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
    }

    public getRoles(): Observable<Roles> {
        return this.http.get<Roles>(`${environment.server}roles/`)
    }
    
    public postRol(rol: Rol): Observable<Respuesta> {
        return this.http.post<Respuesta>(`${environment.server}roles/`, rol)
    }

    public getRolById(id: number): Observable<RolRespuesta> {
        return this.http.get<RolRespuesta>(`${environment.server}roles/${id}`)
    }

    public updateRol(rol: Rol, id: number): Observable<Respuesta> {
        return this.http.put<Respuesta>(`${environment.server}roles/${id}`, rol)
    }

    public deleteRol(id: number): Observable<Respuesta> {
        return this.http.delete<Respuesta>(`${environment.server}roles/${id}`)
    }
}