import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMOrdenCompraComponent } from './abm-orden-compra.component';
import { OrdenCompraListComponent } from './components/orden-compra-list/orden-compra-list.component';
import { OrdenCompraFormComponent } from './components/orden-compra-form/orden-compra-form.component';

const routes: Route[] = [
    {
        path: '',
        component: ABMOrdenCompraComponent,
        children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            { path: 'list', component: OrdenCompraListComponent },
            { path: 'create', component: OrdenCompraFormComponent }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ABMOrdenCompraRoutingModule { }