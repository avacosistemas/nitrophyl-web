import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AbmOrdenCompraService } from './abm-orden-compra.service';
import { OrdenCompraListComponent } from './components/orden-compra-list/orden-compra-list.component';
import { OrdenCompraFormComponent } from './components/orden-compra-form/orden-compra-form.component';

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
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => this.updateBreadcrumbs());
    }

    ngAfterContentChecked(): void { this.cdref.detectChanges(); }

    handleAction(action: string): void {
        if (action === 'create') this.router.navigate(['/orden-compra/create']);
        else this._service.triggerAction(action);
    }

    onChildActivate(component: any): void { this.currentComponent = component; this.updateBreadcrumbs(); }

    private updateBreadcrumbs(): void {
        const base = [
            { title: 'Administración',  route: [], condition: true },
            { title: 'Órdenes de Compra', route: ['/orden-compra'], condition: true }
        ];
        if (this.currentComponent instanceof OrdenCompraListComponent) {
            this.title = 'Órdenes de Compra';
            this.breadcrumbs = base;
            this.buttons = [{ type: 'flat', label: 'Crear Orden de Compra', action: 'create', condition: true }];
        } else if (this.currentComponent instanceof OrdenCompraFormComponent) {
            this.title = 'Generar Orden';
            this.breadcrumbs = [...base, { title: 'Nueva', route: [], condition: true }];
        }
    }
}