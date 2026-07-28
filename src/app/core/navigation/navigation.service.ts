import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of, tap, catchError } from 'rxjs';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavegacionService } from 'app/core/services/navegacion.service';

@Injectable({
    providedIn: 'root'
})
export class NavigationService
{
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _navegacionService: NavegacionService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation>
    {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation>
    {
        return this._httpClient.get<Navigation>('api/common/navigation').pipe(
            catchError(() => {
                const navFallback: Navigation = {
                    compact: [],
                    default: this._navegacionService.get(),
                    futuristic: [],
                    horizontal: []
                };
                return of(navFallback);
            }),
            tap((navigation) => {
                if (!navigation || !navigation.default) {
                    navigation = {
                        compact: navigation?.compact || [],
                        default: this._navegacionService.get(),
                        futuristic: navigation?.futuristic || [],
                        horizontal: navigation?.horizontal || []
                    };
                }
                this._navigation.next(navigation);
            })
        );
    }
}
