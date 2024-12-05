import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { finalize, Subject, takeUntil, takeWhile, timer, tap } from 'rxjs';

@Component({
    selector: 'permission-denied',
    templateUrl: './permission-denied.component.html',
    encapsulation: ViewEncapsulation.None
})
export class PermissionDeniedComponent implements OnInit, OnDestroy {
    countdown: number = 3;
    countdownMapping: any = {
        '=1': '# second',
        'other': '# seconds'
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private previousUrl: string | null = null;

    constructor(
        private _router: Router,
        private location: Location
    ) {
        const navigation = this._router.getCurrentNavigation();
        this.previousUrl = navigation?.previousNavigation?.finalUrl?.toString() || null;
    }

    ngOnInit(): void {
        timer(1000, 1000)
            .pipe(
                finalize(() => {
                    this._router.navigate([this.previousUrl || 'welcome']);
                }),
                takeWhile(() => this.countdown > 0),
                takeUntil(this._unsubscribeAll),
                tap(() => this.countdown--)
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    goBack(): void {
        this.location.back();
    }
}
