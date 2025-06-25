import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';
import { User } from 'app/core/user/user.types';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private _authenticated: boolean = false;
    private _userPermissions: string[] = [];

    // -----------------------------------------------------------------------------------------------------
    // @ Constructor
    // -----------------------------------------------------------------------------------------------------
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService
    ) {
        const token = this.accessToken;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------
    /**
     * Getter for access token
     */
    get accessToken(): string {
        const token = localStorage.getItem('accessToken');

        if (token && token.split('.').length === 3) {
            return token;
        } else {
            console.error('Token inválido encontrado en localStorage:', token);
            return '';
        }
    }

    /**
     * Setter for access token
     */
    set accessToken(token: string) {
        if (token && token.trim()) {
            if (token.split('.').length === 3) {
                localStorage.setItem('accessToken', token);
            } else {
                console.error('Intentando guardar un token inválido (sin tres partes):', token);
            }
        } else {
            // console.error('Token recibido es undefined o vacío:', token);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(username: string): Observable<any> {
        const apiURL = this.getApiUrl('password/reset/');
        return this._httpClient.post(apiURL, { username });
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        const apiURL = this.getApiUrl('auth/reset-password');
        return this._httpClient.post(apiURL, password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { username: string; password: string }): Observable<any> {
        const apiURL = this.getApiUrl('auth');

        return this._httpClient.post(apiURL, credentials).pipe(
            switchMap((response: any) => {
                if (response && response.token) {
                    this.accessToken = response.token;
                    this._authenticated = true;

                    const user = {
                        name: response.name,
                        lastname: response.lastname,
                        email: response.email,
                        username: credentials.username
                    };
                    localStorage.setItem('userData', JSON.stringify(user));
                    localStorage.setItem('userPermissions', JSON.stringify(response.permissions));

                    this._userService.user = user;

                    return of(response);
                } else {
                    return throwError(() => new Error('Token no encontrado'));
                }
            }),
            catchError(error => throwError(() => new Error('Autenticación fallida')))
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        const apiURL = this.getApiUrl('refresh');

        return this._httpClient.post(apiURL, null).pipe(
            catchError(() => of(false)),
            switchMap((response: any) => {
                this.accessToken = response.accessToken;
                this._authenticated = true;
                this._userService.user = response.user;
                return of(true);
            })
        );
    }

    // signInUsingToken(): Observable<any> {
    //     const apiURL = this.getApiUrl('refresh');

    //     return this._httpClient.post(apiURL, null).pipe(
    //         catchError(() => of(false)),
    //         switchMap((response: any) => {
    //             if (response && response.token) {
    //                 this.accessToken = response.token;
    //                 this._authenticated = true;

    //                 const user = {
    //                     name: response.name,
    //                     lastname: response.lastname,
    //                     email: response.email,
    //                 };
    //                 localStorage.setItem('userData', JSON.stringify(user)); 
    //                 localStorage.setItem('userPermissions', JSON.stringify(response.permissions));
    //                 this._userService.user = user;
    //                 return of(true);
    //             } else {
    //                 return of(false);
    //             }
    //         })
    //     );
    // }
    /**
     * Sign out
     */
    signOut(): Observable<any> {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userPermissions');
        this._authenticated = false;
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
        const apiURL = this.getApiUrl('auth/sign-up');
        return this._httpClient.post(apiURL, user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        const apiURL = this.getApiUrl('auth/unlock-session');
        return this._httpClient.post(apiURL, credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        if (this._authenticated) {
            return of(true);
        }

        if (!this.accessToken) {
            console.error('No se encontró un token de acceso');
            return of(false);
        }

        if (AuthUtils.isTokenExpired(this.accessToken)) {
            console.error('El token ha expirado');
            return of(false);
        }

        return this.signInUsingToken();
    }

    hasPermission(permission: string): boolean {
        return this._userPermissions.includes(permission);
    }

    handleLoginSuccess(response: any): void {
        if (response && response.permissions) {
            localStorage.setItem('userPermissions', JSON.stringify(response.permissions));
        }
    }

    getUserPermissions(): string[] {
        return JSON.parse(localStorage.getItem('userPermissions') || '[]');
    }

    getUserData(): { name: string; lastname: string; email: string; username: string } | null {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private helper method to get API URL
    // -----------------------------------------------------------------------------------------------------
    private getApiUrl(endpoint: string): string {
        return `${environment.server}${endpoint}`;
    }
}
