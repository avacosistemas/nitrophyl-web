import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMTransportesComponent } from './abm-transportes.component';
import { TransportesListComponent } from './components/transportes-list/transportes-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMTransportesComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: TransportesListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'MENU_ADMINISTRACION_TRANSPORTES' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmTransportesRoutingModule { }