import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';
import { Router } from '@angular/router';
import { NotificationRelayService, RelayMessage } from 'app/core/services/notification-relay.service';
import { User } from 'app/core/user/user.types';
import { AuthData, AuthResponse } from 'app/core/auth/auth.types';

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
        private _userService: UserService,
        private _router: Router,
        private _notificationRelay: NotificationRelayService
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
                const data = response?.data || response;

                if (data && data.token) {
                    this.accessToken = data.token;
                    this._authenticated = true;

                    const permissions = this._extractPermissions(data);
                    this._userPermissions = permissions;

                    const user: User = {
                        guid: data.guid,
                        name: data.name,
                        lastname: data.lastname,
                        email: data.email,
                        username: data.username || credentials.username,
                        role: data.role,
                        passwordExpired: data.passwordExpired
                    };
                    localStorage.setItem('userData', JSON.stringify(user));
                    localStorage.setItem('userPermissions', JSON.stringify(permissions));

                    this._userService.user = user;

                    return of(response);
                }
                return throwError(() => new Error('Respuesta de éxito inesperada sin token.'));
            }),
            catchError((error: HttpErrorResponse) => {
                if (error.status === 409 && error.error?.status === 'CHANGE_PASSWORD_REQUIRED') {
                    return of(error.error);
                }

                return throwError(() => error);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        const apiURL = this.getApiUrl('refresh');

        return this._httpClient.post(apiURL, null).pipe(
            catchError((error) => {
                this.signOut();
                return of(false);
            }),
            switchMap((response: any) => {
                const data = response?.data || response;
                if (data && data.token) {
                    this.accessToken = data.token;
                    this._authenticated = true;

                    const permissions = this._extractPermissions(data);
                    this._userPermissions = permissions;

                    const user: User = {
                        guid: data.guid,
                        name: data.name,
                        lastname: data.lastname,
                        email: data.email,
                        username: data.username,
                        role: data.role,
                        passwordExpired: data.passwordExpired
                    };
                    localStorage.setItem('userData', JSON.stringify(user));
                    localStorage.setItem('userPermissions', JSON.stringify(permissions));
                    this._userService.user = user;
                    return of(true);
                } else {
                    this.signOut();
                    return of(false);
                }
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        localStorage.clear();
        this._authenticated = false;
        if (this._userService) {
            this._userService.user = null;
        }
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

        const accessToken = this.accessToken;

        if (!accessToken) {
            return of(false);
        }

        if (AuthUtils.isTokenExpired(accessToken)) {
            console.error('El token ha expirado. Cerrando sesión.');
            this.signOut();
            return of(false);
        }

        return this.signInUsingToken();
    }

    hasPermission(permission: string): boolean {
        const permissions = this.getUserPermissions();
        return permissions.includes(permission);
    }

    handleLoginSuccess(response: any): void {
        const data = response?.data || response;
        const permissions = this._extractPermissions(data);
        if (permissions.length > 0) {
            localStorage.setItem('userPermissions', JSON.stringify(permissions));
            this._userPermissions = permissions;
        }
    }

    getUserPermissions(): string[] {
        const stored = localStorage.getItem('userPermissions');
        if (!stored) {
            return [];
        }
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            if (typeof parsed === 'string') {
                return parsed.split(';').map((p: string) => p.trim()).filter(Boolean);
            }
            return [];
        } catch {
            return typeof stored === 'string' ? stored.split(';').map((p: string) => p.trim()).filter(Boolean) : [];
        }
    }

    getUserData(): User | null {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    private _extractPermissions(data: any): string[] {
        const rawPermisos = data?.permisos ?? data?.permissions;
        if (!rawPermisos) {
            return [];
        }
        if (Array.isArray(rawPermisos)) {
            return rawPermisos;
        }
        if (typeof rawPermisos === 'string') {
            return rawPermisos.split(';').map((p: string) => p.trim()).filter(Boolean);
        }
        return [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private helper method to get API URL
    // -----------------------------------------------------------------------------------------------------
    private getApiUrl(endpoint: string): string {
        return `${environment.server}${endpoint}`;
    }
}
