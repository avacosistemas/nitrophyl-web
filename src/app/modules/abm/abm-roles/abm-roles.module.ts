import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMRolesComponent } from './abm-roles.component';
import { ABMSharedModule } from '../abm-shared.module';

const abmRolesRoutes: Route[] = [
    {
        path     : '',
        component: ABMRolesComponent
    }
];

@NgModule({
    declarations: [
        ABMRolesComponent
    ],
    imports     : [
        RouterModule.forChild(abmRolesRoutes),
        ABMSharedModule
    ]
})
export class ABMRolesModule
{
}
