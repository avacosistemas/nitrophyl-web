import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMRolesComponent } from './abm-roles.component';
import { ABMSharedModule } from '../abm-shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { ABMRolesGrillaComponent } from './grilla/abm-roles-grilla.component';
import { ABMCrearRol } from './crear-rol/abm-roles-crear.component';
import { ABMRolesRol } from './rol/abm-roles-rol.component';

const abmRolesRoutes: Route[] = [
    {
        path     : '',
        component: ABMRolesComponent,
        children: [
            { path: 'grid', component: ABMRolesGrillaComponent },
            { path: 'create', component: ABMCrearRol },
            { path: 'role/:id', component: ABMRolesRol }
        ]
    }
];

@NgModule({
    declarations: [
        ABMRolesComponent,
        ABMRolesGrillaComponent,
        ABMRolesRol,
        ABMCrearRol
    ],
    imports     : [
        RouterModule.forChild(abmRolesRoutes),
        ABMSharedModule,
        HeaderSharedModule
    ]
})
export class ABMRolesModule
{
}
