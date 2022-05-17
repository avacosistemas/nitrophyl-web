import { HttpBackend, HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { UserLogin } from "../models/user-login.model";

@Injectable({
    providedIn: 'root'
})

export class AutorizacionService {
    private loggedUser = {
        id: '',
        name: '',
        email: ''
    }

    constructor(
        private http: HttpClient,
        private handler: HttpBackend) {
            this.http = new HttpClient(handler)
    }

    public login(userLogin: UserLogin): Observable<any> {
        return this.http.post<any>(`${environment.server}auth/`, userLogin)
    }

    public getToken(): Observable<any> {
        return this.http.get<any>(`${environment.server}auth/`)
    }

    public setUser(user) {
        this.loggedUser = user;
    }

    public getUser() {
        return this.loggedUser;
    }
}