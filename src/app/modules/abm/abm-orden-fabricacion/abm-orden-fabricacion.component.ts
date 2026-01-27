import { Component, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AbmOrdenFabricacionService } from './abm-orden-fabricacion.service';
import { OrdenFabricacionListComponent } from './components/orden-fabricacion-list/orden-fabricacion-list.component';
import { OrdenFabricacionFormComponent } from './components/orden-fabricacion-form/orden-fabricacion-form.component';

@Component({
    selector: 'abm-orden-fabricacion',
    templateUrl: './abm-orden-fabricacion.component.html',
    styleUrls: ['./abm-orden-fabricacion.component.scss']
})
export class ABMOrdenFabricacionComponent implements AfterContentChecked {
    title: string = 'Órdenes de Fabricación';
    subtitle: string = '';
    breadcrumbs: any[] = [];
    buttons: any[] = [];
    private currentComponent: any;

    constructor(
        public dialog: MatDialog,
        private cdref: ChangeDetectorRef,
        private router: Router,
        private _ofService: AbmOrdenFabricacionService
    ) {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.updateHeader();
        });

        this._ofService.headerButtons$.subscribe(btns => {
            this.buttons = btns;
            this.cdref.markForCheck();
        });

        this._ofService.headerSubtitle$.subscribe(sub => {
            this.subtitle = sub;
            this.cdref.markForCheck();
        });
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }

    handleAction(action: string): void {
        if (action === 'create' && this.currentComponent instanceof OrdenFabricacionListComponent) {
            this.router.navigate(['/orden-fabricacion/create']);
        } else {
            this._ofService.triggerAction(action);
        }
    }

    onChildActivate(component: any): void {
        this.currentComponent = component;
        this.updateHeader();
    }

    private updateHeader(): void {
        const baseBreadcrumb = [
            { title: 'Administración', route: [], condition: true },
            { title: 'Órdenes de Fabricación', route: ['/orden-fabricacion'], condition: true }
        ];

        if (this.currentComponent instanceof OrdenFabricacionListComponent) {
            this.title = 'Órdenes de Fabricación';
            this.subtitle = '';
            this.breadcrumbs = baseBreadcrumb;
            // this.buttons = [{
            //     type: 'flat',
            //     label: 'Crear Orden de Fabricación',
            //     condition: true,
            //     isDisabled: false,
            //     action: 'create'
            // }];
        } else if (this.currentComponent instanceof OrdenFabricacionFormComponent) {
            this.title = 'Generar Orden';
            this.breadcrumbs = [...baseBreadcrumb, { title: 'Nueva', route: [], condition: true }];
        }
    }
}