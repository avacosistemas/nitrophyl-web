import { Route } from '@angular/router';
import { AuthChangePasswordComponent } from 'app/modules/auth/change-password/change-password.component';

export const authChangePasswordRoutes: Route[] = [
    {
        path: '',
        component: AuthChangePasswordComponent
    }
];