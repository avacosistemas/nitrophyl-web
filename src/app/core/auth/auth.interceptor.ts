import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private router: Router
    ) {}

    /**
     * Intercept
     *
     * @param req
     * @param next
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let newReq = req.clone();

        const accessToken = this._authService.accessToken;

        if (accessToken && !AuthUtils.isTokenExpired(accessToken)) {
            newReq = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + accessToken)
            });
        }

        return next.handle(newReq).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    const currentUrl = this.router.url;
                    if (currentUrl !== '/sign-in') {
                        this._authService.signOut();
                        // location.reload();
                    }
                }
                return throwError(error);
            })
        );
    }
}
