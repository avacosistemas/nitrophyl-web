import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMUsuariosComponent } from './abm-usuarios.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMUsuariosUserComponent } from './user/abm-usuarios-user.component';
import { ABMUsuariosGrillaComponent } from './grilla/abm-usuarios-grilla.component';

const abmUsuariosRoutes: Route[] = [
    {
        path     : '',
        component: ABMUsuariosComponent,
        children: [
            {path: 'user/:id', component: ABMUsuariosUserComponent},
            {path: 'grid', component: ABMUsuariosGrillaComponent}
        ]
    }
];

@NgModule({
    declarations: [
        ABMUsuariosComponent,
        ABMUsuariosUserComponent,
        ABMUsuariosGrillaComponent
    ],
    imports     : [
        RouterModule.forChild(abmUsuariosRoutes),
        ABMSharedModule
    ]
})
export class ABMUsuariosModule
{
}
