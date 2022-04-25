import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMPermisosComponent } from './abm-permisos.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMPermisosDialog } from './dialog/abm-permisos-dialog.component';
import { ABMCrearPermisoDialog } from './dialog-crear/abm-permisos-crear-dialog.component';
import { ABMPermisosGrillaComponent } from './grilla/abm-permisos-grilla.component';
import { ABMPermisosPermiso } from './permiso/abm-permisos-permiso.component';
import { ABMCrearPermiso } from './crear-permiso/abm-permisos-crear.component';

const abmPermisosRoutes: Route[] = [
    {
        path     : '',
        component: ABMPermisosComponent,
        children: [
            {path: 'permission/:id', component: ABMPermisosPermiso},
            {path: 'create', component: ABMCrearPermiso},
            { path: 'grid', component: ABMPermisosGrillaComponent},
        ]
    }
];

@NgModule({
    declarations: [
        ABMPermisosComponent,
        ABMPermisosDialog,
        ABMCrearPermisoDialog,
        ABMPermisosGrillaComponent,
        ABMPermisosPermiso,
        ABMCrearPermiso
    ],
    imports     : [
        RouterModule.forChild(abmPermisosRoutes),
        ABMSharedModule
    ]
})
export class ABMPermisosModule
{
}
