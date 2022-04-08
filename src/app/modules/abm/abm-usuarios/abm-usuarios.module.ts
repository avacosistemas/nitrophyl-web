import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMUsuariosComponent } from './abm-usuarios.component';
import { MatTableModule } from '@angular/material/table';

const abmUsuariosRoutes: Route[] = [
    {
        path     : '',
        component: ABMUsuariosComponent
    }
];

@NgModule({
    declarations: [
        ABMUsuariosComponent
    ],
    imports     : [
        RouterModule.forChild(abmUsuariosRoutes),
        CommonModule,
        MatTableModule
    ]
})
export class ABMUsuariosModule
{
}
