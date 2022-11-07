import { HttpClient, HttpBackend } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { Cliente, Contacto, ResponseCliente, ResponseClientes, ResponseContacto, ResponseContactos } from "../models/cliente.model";
import { Boca, Dimension, Molde, MoldeRegistro, ResponseBoca, ResponseDimension } from "../models/molde.model";


@Injectable({
    providedIn: 'root'
})

export class ClientesService {

    private mode: string;

    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
    }

    public getClientes(): Observable<ResponseClientes> { //listado clientes
        return this.http.get<ResponseClientes>(`${environment.server}clientes/`)
    }

    public createCliente(cliente: Cliente): Observable<any> { //crear cliente
        return this.http.post<any>(`${environment.server}cliente`, cliente)
    }

    public updateCliente(id: number, cliente: Cliente): Observable<any> { //actualizar cliente
        return this.http.put<any>(`${environment.server}cliente/${id}`, cliente)
    }

    public getClienteById(id: number): Observable<ResponseCliente> { //cliente por id
        return this.http.get<ResponseCliente>(`${environment.server}cliente/${id}`)
    }

    public getContactos(id: number): Observable<ResponseContactos> { //listado contactos
        return this.http.get<ResponseContactos>(`${environment.server}cliente/${id}/contacto`)
    }

    public getContactoById(id: number): Observable<ResponseContacto> { //contacto por id
        return this.http.get<ResponseContacto>(`${environment.server}cliente/contacto/${id}`)
    }

    public createContacto(id: number, contacto: Contacto): Observable<any> { //crear contacto
        return this.http.post<any>(`${environment.server}cliente/${id}/contacto`, contacto)
    }

    public updateContacto(id: number, contacto: Contacto): Observable<any> { //actualizar contacto
        return this.http.put<any>(`${environment.server}cliente/contacto/${id}`, contacto)
    }

    public deleteContacto(idContacto: number): Observable<any> {
        return this.http.delete<any>(`${environment.server}cliente/contacto/${idContacto}`)
    }

    public getProvincias(): Observable<any> {
        return this.http.get<any>(`${environment.server}provincias/`)
    }

    public getMode() {
        return this.mode;
    }

    public setMode(mode: string) {
        this.mode = mode;
    }
}