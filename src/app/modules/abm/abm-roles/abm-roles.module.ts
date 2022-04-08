import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { ABMRolesComponent } from './abm-roles.component';

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
        CommonModule,
        MatTableModule
    ]
})
export class ABMRolesModule
{
}
