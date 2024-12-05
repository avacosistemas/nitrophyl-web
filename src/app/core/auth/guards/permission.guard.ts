import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

    constructor(private _authService: AuthService, private _router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const requiredPermission: string = route.data['permission'];

        const userPermissions: string[] = JSON.parse(localStorage.getItem('userPermissions') || '[]');

        if (userPermissions.includes(requiredPermission)) {
            return true;
        } else {
            this._router.navigate(['permission-denied']);
            return false;
        }
    }
}
