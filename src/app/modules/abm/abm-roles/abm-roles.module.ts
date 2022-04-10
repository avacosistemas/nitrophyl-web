import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMRolesComponent } from './abm-roles.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMRolesDialog } from './dialog/abm-roles-dialog.component';
import { ABMCrearRolDialog } from './dialog-crear/abm-roles-crear-dialog.component';

const abmRolesRoutes: Route[] = [
    {
        path     : '',
        component: ABMRolesComponent
    }
];

@NgModule({
    declarations: [
        ABMRolesComponent,
        ABMRolesDialog,
        ABMCrearRolDialog
    ],
    imports     : [
        RouterModule.forChild(abmRolesRoutes),
        ABMSharedModule
    ]
})
export class ABMRolesModule
{
}
