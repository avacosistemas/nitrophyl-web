import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type SnackBarType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private _snackBar: MatSnackBar) { }

    public showSuccess(message: string, duration: number = 5000): void {
        this.show(message, 'success', duration);
    }

    public showError(message: string, duration: number = 5000): void {
        this.show(message, 'error', duration);
    }

    public showWarning(message: string, duration: number = 5000): void {
        this.show(message, 'warning', duration);
    }

    public showInfo(message: string, duration: number = 5000): void {
        this.show(message, 'info', duration);
    }

    private show(message: string, type: SnackBarType, duration: number): void {
        const cssClassMap = {
            success: 'green-snackbar',
            error: 'red-snackbar',
            warning: 'yellow-snackbar',
            info: 'blue-snackbar'
        };

        const panelClass = cssClassMap[type];

        this._snackBar.open(message, 'X', {
            duration: duration,
            panelClass: [panelClass],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }
}

// COMO UTILIZARLO
// import { NotificationService } from 'app/shared/services/notification.service';

// constructor...
// private notificationService: NotificationService 

// this.notificationService.showError("MSG");
// this.notificationService.showSuccess("MSG");