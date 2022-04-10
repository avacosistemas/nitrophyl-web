import { HttpBackend, HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Respuesta } from "../../shared/models/respuesta.model";
import { User, UserList, UserResponse } from "../models/user.model";
import { environment } from "environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})



export class UserService {

    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
        }

    public getUsers(): Observable<UserList> {
        return this.http.get<UserList>(`${environment.server}users/`)
    }

    public postUser(user: User): Observable<Respuesta> {
        return this.http.post<Respuesta>(`${environment.server}users/`, user)
    }

    public getUserById(id: number): Observable<UserResponse> {
        return this.http.get<UserResponse>(`${environment.server}users/${id}`)
    }

    public updateUser(user: User, id: number): Observable<Respuesta> {
        return this.http.put<Respuesta>(`${environment.server}users/${id}`, user)
    }

    public deleteUser(id: number): Observable<Respuesta> {
        return this.http.delete<Respuesta>(`${environment.server}users/${id}`)
    }

    public updateUserValidation(user: User): Observable<Respuesta> {
        return this.http.post<Respuesta>(`${environment.server}users/update/validation/`, user)
    }
}