import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService: AuthService;

    constructor(
        private injector: Injector,
        private router: Router
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.authService = this.injector.get(AuthService);
        let newReq = req.clone();

        const accessToken = this.authService.accessToken;

        if (accessToken && !AuthUtils.isTokenExpired(accessToken)) {
            newReq = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + accessToken)
            });
        }

        return next.handle(newReq).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    const currentUrl = this.router.url;
                    if (currentUrl !== '/sign-in' && currentUrl !== '/forgot-password') {
                        this.authService.signOut().subscribe();
                    }
                }
                return throwError(error);
            })
        );
    }
}