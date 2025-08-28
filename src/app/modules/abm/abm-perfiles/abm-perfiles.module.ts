import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMSharedModule } from '../abm-shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { ABMPerfilesComponent } from './abm-perfiles.component';
import { ABMPerfilesGrillaComponent } from './grilla/abm-perfiles-grilla.component';
import { ABMCrearPerfil } from './crear-perfil/abm-perfiles-crear.component';
import { ABMPerfilesPerfil } from './perfil/abm-perfiles-perfil.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const abmPerfilesRoutes: Route[] = [
    {
        path: '',
        component: ABMPerfilesComponent,
        children: [
            {
                path: '',
                redirectTo: 'grid',
                pathMatch: 'full'
            },
            {
                path: 'profile/:id', component: ABMPerfilesPerfil
            },
            {
                path: 'grid', component: ABMPerfilesGrillaComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'MENU_SEGURIDAD_PERFILES' }
            },
            { path: 'create', component: ABMCrearPerfil },
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
    imports: [
        RouterModule.forChild(abmPerfilesRoutes),
        ABMSharedModule,
        HeaderSharedModule
    ]
})
export class ABMPerfilesModule {
}
