import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { ABMPermisosComponent } from './abm-permisos.component';

const abmPermisosRoutes: Route[] = [
    {
        path     : '',
        component: ABMPermisosComponent
    }
];

@NgModule({
    declarations: [
        ABMPermisosComponent
    ],
    imports     : [
        RouterModule.forChild(abmPermisosRoutes),
        CommonModule,
        MatTableModule
    ]
})
export class ABMPermisosModule
{
}
