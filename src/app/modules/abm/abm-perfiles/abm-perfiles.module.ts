import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMPerfilesComponent } from './abm-perfiles.component';
import { ABMPerfilesGrillaComponent } from './grilla/abm-perfiles-grilla.component';
import { ABMCrearPerfil } from './crear-perfil/abm-perfiles-crear.component';
import { ABMPerfilesPerfil } from './perfil/abm-perfiles-perfil.component';

const abmPerfilesRoutes: Route[] = [
    {
        path     : '',
        component: ABMPerfilesComponent,
        children: [
            {path: 'profile/:id', component: ABMPerfilesPerfil},
            {path: 'grid', component: ABMPerfilesGrillaComponent},
            {path: 'create', component: ABMCrearPerfil},
        ]
    }
];

@NgModule({
    declarations: [
        ABMPerfilesComponent,
        ABMPerfilesGrillaComponent,
        ABMCrearPerfil,
        ABMPerfilesPerfil
    ],
    imports     : [
        RouterModule.forChild(abmPerfilesRoutes),
        ABMSharedModule
    ]
})
export class ABMPerfilesModule
{
}
