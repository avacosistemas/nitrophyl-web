import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface UpdatePasswordPayload {
    username: string;
    password: string;
    newPassword: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChangePasswordService {

    private readonly baseUrl: string = `${environment.server}password`;

    constructor(private _httpClient: HttpClient) {
    }

    updatePassword(payload: UpdatePasswordPayload): Observable<any> {
        const endpoint = `${this.baseUrl}/update/`;
        return this._httpClient.post(endpoint, payload);
    }
}