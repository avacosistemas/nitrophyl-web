import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMOrdenFabricacionComponent } from './abm-orden-fabricacion.component';
import { OrdenFabricacionListComponent } from './components/orden-fabricacion-list/orden-fabricacion-list.component';
import { OrdenFabricacionFormComponent } from './components/orden-fabricacion-form/orden-fabricacion-form.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMOrdenFabricacionComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_ADMINISTRACION_ORDEN_FABRICACION' },
        children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            { path: 'list', component: OrdenFabricacionListComponent },
            { path: 'create', component: OrdenFabricacionFormComponent, data: { mode: 'create' } },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ABMOrdenFabricacionRoutingModule { }