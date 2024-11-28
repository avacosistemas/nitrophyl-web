import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMUsuariosComponent } from './abm-usuarios.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMUsuariosUserComponent } from './user/abm-usuarios-user.component';
import { ABMUsuariosGrillaComponent } from './grilla/abm-usuarios-grilla.component';
import { ABMUsuariosCrearComponent } from './crear-user/abm-usuarios-crear.component';

import { CoreSharedModule } from 'app/core/shared/shared.module';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const abmUsuariosRoutes: Route[] = [
    {
        path: '',
        component: ABMUsuariosComponent,
        children: [
            {
                path: 'user/:id',
                component: ABMUsuariosUserComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'USUARIO_MODIFY' },
            },
            {
                path: 'grid',
                component: ABMUsuariosGrillaComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'USUARIO_READ' },
            },
            {
                path: 'create',
                component: ABMUsuariosCrearComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'USUARIO_CREATE' },
            },
        ],
    }
];

@NgModule({
    declarations: [
        ABMUsuariosComponent,
        ABMUsuariosUserComponent,
        ABMUsuariosGrillaComponent,
        ABMUsuariosCrearComponent
    ],
    imports: [
        RouterModule.forChild(abmUsuariosRoutes),
        ABMSharedModule,
        CoreSharedModule
    ]
})
export class ABMUsuariosModule {
}
