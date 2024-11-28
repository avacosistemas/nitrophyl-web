import { Component, OnInit } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'welcome',
    templateUrl: './welcome.component.html',
})
export class WelcomeComponent implements OnInit {
    userName: string = '';

    constructor(private _authService: AuthService) {}

    ngOnInit(): void {
        // Obtener datos del usuario desde el AuthService
        const userData = this._authService.getUserData();
        this.userName = userData ? `${userData.name} ${userData.lastname}` : 'Usuario';
    }
}
