import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMPermisosComponent } from './abm-permisos.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMPermisosDialog } from './dialog/abm-permisos-dialog.component';

const abmPermisosRoutes: Route[] = [
    {
        path     : '',
        component: ABMPermisosComponent
    }
];

@NgModule({
    declarations: [
        ABMPermisosComponent,
        ABMPermisosDialog
    ],
    imports     : [
        RouterModule.forChild(abmPermisosRoutes),
        ABMSharedModule
    ]
})
export class ABMPermisosModule
{
}
