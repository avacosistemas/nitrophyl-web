import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMOrdenCompraComponent } from './abm-orden-compra.component';
import { OrdenCompraListComponent } from './components/orden-compra-list/orden-compra-list.component';
import { OrdenCompraFormComponent } from './components/orden-compra-form/orden-compra-form.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMOrdenCompraComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_ADMINISTRACION_ORDEN_COMPRA' },
        children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            { path: 'list', component: OrdenCompraListComponent },
            { path: 'create', component: OrdenCompraFormComponent },
            { path: 'edit/:id', component: OrdenCompraFormComponent },
            { path: 'view/:id', component: OrdenCompraFormComponent }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ABMOrdenCompraRoutingModule { }