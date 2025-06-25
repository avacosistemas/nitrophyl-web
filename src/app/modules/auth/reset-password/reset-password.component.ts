import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseValidators } from '@fuse/validators';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { ChangePasswordService, UpdatePasswordPayload } from 'app/core/auth/change-password.service';

@Component({
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
    animations: fuseAnimations
})
export class AuthResetPasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    resetPasswordForm: FormGroup;
    showAlert: boolean = false;
    private tempCredentials: { username: string, temporaryPassword: string };

    constructor(
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _authService: AuthService,
        private _changePasswordService: ChangePasswordService
    ) { }

    ngOnInit(): void {
        const storedCredentials = localStorage.getItem('tempUserCredentials');

        if (!storedCredentials) {
            console.error('No se encontraron credenciales temporales. Redirigiendo...');
            this._router.navigate(['/sign-in']);
            return;
        }

        this.tempCredentials = JSON.parse(storedCredentials);

        this.resetPasswordForm = this._formBuilder.group({
            password: ['', Validators.required],
            passwordConfirm: ['', Validators.required]
        },
            {
                validators: FuseValidators.mustMatch('password', 'passwordConfirm')
            }
        );
    }

    updatePasswordAndLogin(): void {
        if (this.resetPasswordForm.invalid) {
            return;
        }

        this.resetPasswordForm.disable();
        this.showAlert = false;

        const newPassword = this.resetPasswordForm.get('password').value;

        const payload: UpdatePasswordPayload = {
            username: this.tempCredentials.username,
            password: this.tempCredentials.temporaryPassword,
            newPassword: newPassword
        };

        this._changePasswordService.updatePassword(payload).pipe(
            switchMap(() => {
                return this._authService.signIn({
                    username: this.tempCredentials.username,
                    password: newPassword
                });
            }),
            finalize(() => {
                localStorage.removeItem('tempUserCredentials');
            })
        ).subscribe({
            next: (loginResponse) => {
                this._router.navigate(['/welcome']);
            },
            error: (err) => {
                this.resetPasswordForm.enable();
                this.showAlert = true;
                this.alert = {
                    type: 'error',
                    message: err.error?.message || 'Ocurrió un error. Por favor, verifica la contraseña o inténtalo de nuevo.'
                };
            }
        });
    }
}