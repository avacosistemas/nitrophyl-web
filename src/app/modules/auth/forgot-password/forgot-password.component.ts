import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-forgot-password',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class AuthForgotPasswordComponent implements OnInit {
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    forgotPasswordForm: FormGroup;
    showAlert: boolean = false;

    requestSuccessful: boolean = false;

    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder
    ) {
    }

    ngOnInit(): void {
        this.forgotPasswordForm = this._formBuilder.group({
            username: ['', [Validators.required]]
        });
    }

    sendResetLink(): void {
        if (this.forgotPasswordForm.invalid) {
            return;
        }

        this.forgotPasswordForm.disable();
        this.showAlert = false;

        const username = this.forgotPasswordForm.get('username').value;

        this._authService.forgotPassword(username)
            .pipe(
                finalize(() => {
                    this.showAlert = true;
                })
            )
            .subscribe({
                next: () => {
                    this.requestSuccessful = true;

                    this.alert = {
                        type: 'success',
                        message: 'Recibirás un correo electrónico con la nueva contraseña.'
                    };
                },
                error: (error) => {
                    this.forgotPasswordForm.enable();

                    this.alert = {
                        type: 'error',
                        message: error.error?.message || 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.'
                    };
                }
            });
    }
}