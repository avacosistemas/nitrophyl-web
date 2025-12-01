import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { Subject, takeUntil, timer } from 'rxjs';

@Component({
    selector: 'auth-sign-out',
    templateUrl: './sign-out.component.html'
})
export class AuthSignOutComponent implements OnInit, OnDestroy {

    countdown: number = 5;
    countdownDisplay: string = '';
    message: string = 'Espere un momento...';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this._activatedRoute.queryParamMap
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                if (params.get('reason') === 'session_expired') {
                    this.message = 'Tu sesión ha expirado o es inválida. Serás redirigido.';
                }
            });

        this._authService.signOut().subscribe();

        timer(1000, 1000)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                if (this.countdown <= 1) {
                    this._router.navigate(['/sign-in']);
                    return;
                }

                this.countdown--;
                this.countdownDisplay = ` (${this.countdown})`;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}