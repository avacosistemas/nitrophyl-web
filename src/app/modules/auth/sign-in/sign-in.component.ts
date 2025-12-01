import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector   : 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    animations : fuseAnimations
})
export class AuthSignInComponent implements OnInit
{
    @ViewChild('loginNgForm') loginNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    loginForm: FormGroup;
    showAlert: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void
    {
        this.loginForm = this._formBuilder.group({
            username : ['', [Validators.required]],
            password : ['', Validators.required]
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    login(event: Event): void
    {
        event.preventDefault();

        if ( this.loginForm.invalid )
        {
            return;
        }

        this.loginForm.disable();

        this.showAlert = false;

        this._authService.signIn(this.loginForm.value)
            .pipe(
                finalize(() => {
                    this.loginForm.enable();
                })
            )
            .subscribe(
                (response) => {
                    if (response && response.status === 'CHANGE_PASSWORD_REQUIRED') {
                        this._router.navigate(['/change-password'], { 
                            state: { username: this.loginForm.get('username').value } 
                        });
                        return;
                    }

                    this._router.navigateByUrl('/welcome');
                },
                (error) => {
                    this.alert = {
                        type   : 'error',
                        message: 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.'
                    };
                    this.showAlert = true;
                }
            );
    }
}