import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMUsuariosComponent } from './abm-usuarios.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMUsuariosDialog } from './dialog/abm-usuarios-dialog.component';

const abmUsuariosRoutes: Route[] = [
    {
        path     : '',
        component: ABMUsuariosComponent
    }
];

@NgModule({
    declarations: [
        ABMUsuariosComponent,
        ABMUsuariosDialog
    ],
    imports     : [
        RouterModule.forChild(abmUsuariosRoutes),
        ABMSharedModule
    ]
})
export class ABMUsuariosModule
{
}
