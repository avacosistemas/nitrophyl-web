import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMUsuariosComponent } from './abm-usuarios.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMUsuariosUserComponent } from './user/abm-usuarios-user.component';
import { ABMUsuariosGrillaComponent } from './grilla/abm-usuarios-grilla.component';
import { ABMUsuariosCrearComponent } from './crear-user/abm-usuarios-crear.component';

const abmUsuariosRoutes: Route[] = [
    {
        path     : '',
        component: ABMUsuariosComponent,
        children: [
            {path: 'user/:id', component: ABMUsuariosUserComponent},
            {path: 'grid', component: ABMUsuariosGrillaComponent},
            {path: 'create', component: ABMUsuariosCrearComponent}
        ]
    }
];

@NgModule({
    declarations: [
        ABMUsuariosComponent,
        ABMUsuariosUserComponent,
        ABMUsuariosGrillaComponent,
        ABMUsuariosCrearComponent
    ],
    imports     : [
        RouterModule.forChild(abmUsuariosRoutes),
        ABMSharedModule
    ]
})
export class ABMUsuariosModule
{
}
