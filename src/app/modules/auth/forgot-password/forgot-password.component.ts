import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-forgot-password',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class AuthForgotPasswordComponent implements OnInit, OnDestroy {
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    forgotPasswordForm: FormGroup;
    showAlert: boolean = false;
    requestSuccessful: boolean = false;

    countdown: number = 10;
    countdownMapping: any = {
        '=1': '# segundo',
        'other': '# segundos'
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router
    ) {
    }

    ngOnInit(): void {
        this.forgotPasswordForm = this._formBuilder.group({
            username: ['', [Validators.required]]
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    sendResetLink(): void {
        if (this.forgotPasswordForm.invalid) {
            return;
        }

        this.forgotPasswordForm.disable();
        this.showAlert = false;

        const username = this.forgotPasswordForm.get('username').value;

        this._authService.forgotPassword(username)
            .subscribe({
                next: () => {
                    this.requestSuccessful = true;
                    this.showAlert = true;
                    this.alert = {
                        type: 'success',
                        message: 'Recibirás un correo electrónico con la nueva contraseña.'
                    };

                    this.startCountdown();
                },
                error: (error) => {
                    this.forgotPasswordForm.enable();
                    this.showAlert = true;
                    this.alert = {
                        type: 'error',
                        message: error.error?.message || 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.'
                    };
                }
            });
    }

    private startCountdown(): void {
        const username = this.forgotPasswordForm.get('username').value;

        timer(1000, 1000)
            .pipe(
                finalize(() => {
                    this._router.navigate(['/sign-in'], { queryParams: { username: username } });
                }),
                takeWhile(() => this.countdown > 0),
                takeUntil(this._unsubscribeAll),
                tap(() => this.countdown--)
            )
            .subscribe();
    }
}