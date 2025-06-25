import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { ChangePasswordService, UpdatePasswordPayload } from 'app/core/auth/change-password.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    if (!newPassword || !confirmPassword) { return null; }
    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
};

@Component({
    selector: 'auth-change-password',
    templateUrl: './change-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class AuthChangePasswordComponent implements OnInit {
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    changePasswordForm: FormGroup;
    showAlert: boolean = false;
    updateSuccessful: boolean = false;

    private readonly errorMessages: { [key: string]: string } = {
        'user.currentpassword.invalid': 'La contraseña actual no es válida.',
    };

    constructor(
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _changePasswordService: ChangePasswordService
    ) {
    }

    ngOnInit(): void {
        this.changePasswordForm = this._formBuilder.group({
            oldPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: passwordMatchValidator
        });
    }

    updatePassword(): void {
        if (this.changePasswordForm.invalid) {
            return;
        }

        this.changePasswordForm.disable();
        this.showAlert = false;

        const { oldPassword, newPassword } = this.changePasswordForm.value;
        const userData = this._authService.getUserData();

        if (!userData || !userData.username) {
            this.alert = {
                type: 'error',
                message: 'No se pudo obtener la información del usuario. Por favor, inicie sesión de nuevo.'
            };
            this.showAlert = true;
            this.changePasswordForm.enable();
            return;
        }

        const payload: UpdatePasswordPayload = {
            username: userData.username,
            password: oldPassword,
            newPassword: newPassword
        };

        this._changePasswordService.updatePassword(payload)
            .pipe(
                finalize(() => {
                    if (!this.updateSuccessful) {
                        this.changePasswordForm.enable();
                    }
                    this.showAlert = true;
                })
            )
            .subscribe({
                next: () => {
                    this.updateSuccessful = true;
                    this.alert = {
                        type: 'success',
                        message: '¡Tu contraseña ha sido actualizada correctamente!'
                    };
                },
                error: (error) => {
                    const errorKey = error.error?.message;
                    const defaultMessage = 'Ha ocurrido un error inesperado. Por favor, intente de nuevo.';
                    const message = this.errorMessages[errorKey] || defaultMessage;

                    this.alert = {
                        type: 'error',
                        message: message
                    };
                }
            });
    }
}