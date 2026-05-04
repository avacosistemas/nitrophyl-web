import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AbmOrdenCompraService } from './abm-orden-compra.service';

@Component({
    selector: 'abm-orden-compra',
    templateUrl: './abm-orden-compra.component.html'
})
export class ABMOrdenCompraComponent implements AfterContentChecked {
    title: string = 'Órdenes de Compra';
    subtitle: string = '';
    buttons: any[] = [];
    breadcrumbs: any[] = [];
    private currentComponent: any;

    constructor(
        private _service: AbmOrdenCompraService,
        private cdref: ChangeDetectorRef,
        private router: Router
    ) {
        this._service.headerButtons$.subscribe(btns => { this.buttons = btns; this.cdref.markForCheck(); });
        this._service.headerSubtitle$.subscribe(sub => { this.subtitle = sub; this.cdref.markForCheck(); });
        this._service.headerTitle$.subscribe(title => { this.title = title; this.cdref.markForCheck(); });
        this._service.headerBreadcrumbs$.subscribe(crumbs => { this.breadcrumbs = crumbs; this.cdref.markForCheck(); });
    }

    ngAfterContentChecked(): void { this.cdref.detectChanges(); }

    handleAction(action: string): void {
        if (action === 'create') this.router.navigate(['/orden-compra/create']);
        else this._service.triggerAction(action);
    }

    onChildActivate(component: any): void { 
        this.currentComponent = component; 
    }
}