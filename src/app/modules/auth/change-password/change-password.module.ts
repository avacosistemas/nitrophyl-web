import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseAlertModule } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { AuthChangePasswordComponent } from 'app/modules/auth/change-password/change-password.component';
import { authChangePasswordRoutes } from 'app/modules/auth/change-password/change-password.routing';

@NgModule({
    declarations: [
        AuthChangePasswordComponent
    ],
    imports: [
        RouterModule.forChild(authChangePasswordRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        FuseAlertModule,
        SharedModule
    ]
})
export class AuthChangePasswordModule {
}