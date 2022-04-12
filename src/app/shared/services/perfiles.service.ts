import { HttpClient, HttpBackend } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { Perfil } from "../models/perfil.model";


@Injectable({
    providedIn: 'root'
})

export class PerfilesService {

    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
    }

    public getPerfiles(): Observable<any> {
        return this.http.get<any>(`${environment.server}profiles/`)
    }

    public postPerfil(perfil: Perfil): Observable<any> {
        return this.http.post<any>(`${environment.server}profiles/`, perfil)
    }

    public getPerfilById(id: number): Observable<any> {
        return this.http.get<any>(`${environment.server}profiles/${id}`)
    }

    public updatePerfil(perfil, id: number): Observable<any> {
        return this.http.put<any>(`${environment.server}profiles/${id}`, perfil)
    }

    public deletePerfil(id: number): Observable<any> {
        return this.http.delete<any>(`${environment.server}profiles/${id}`)
    }
}