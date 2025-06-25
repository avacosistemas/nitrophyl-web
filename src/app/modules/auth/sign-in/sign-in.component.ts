import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    animations: fuseAnimations
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('loginNgForm') loginNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    loginForm: FormGroup;
    showAlert: boolean = false;

    constructor(
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _activatedRoute: ActivatedRoute,
        private _router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this._formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', Validators.required]
        });

        this._activatedRoute.queryParamMap.subscribe(params => {
            const usernameFromForgot = params.get('username');
            if (usernameFromForgot) {
                this.loginForm.get('username').setValue(usernameFromForgot);
            }
        });
    }

    login(event: Event): void {
        event.preventDefault();

        if (this.loginForm.invalid) {
            return;
        }

        this.loginForm.disable();
        this.showAlert = false;

        this._authService.signIn(this.loginForm.value).subscribe({
            next: (response) => {
                console.log("el componente response", response);
                if (response && response.status === 'CHANGE_PASSWORD_REQUIRED') {

                    const tempCredentials = {
                        username: this.loginForm.get('username').value,
                        temporaryPassword: this.loginForm.get('password').value
                    };

                    localStorage.setItem('tempUserCredentials', JSON.stringify(tempCredentials));

                    this._router.navigate(['/reset-password']);
                    return;
                }

                if (response && response.permissions) {
                    localStorage.setItem('userPermissions', JSON.stringify(response.permissions));
                    this._authService.handleLoginSuccess(response);
                    const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('welcome') || 'welcome';
                    this._router.navigateByUrl(redirectURL);
                } else {
                    this.handleLoginError('Respuesta inesperada del servidor.');
                }
            },
            error: (error) => {
                this.handleLoginError('Usuario o contraseña incorrectos. Por favor, intenta de nuevo.');
            }
        });
    }


    private handleLoginError(message: string): void {
        this.loginForm.enable();

        this.alert = {
            type: 'error',
            message: message
        };
        this.showAlert = true;
    }
}