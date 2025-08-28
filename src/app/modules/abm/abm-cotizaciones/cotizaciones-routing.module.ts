import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CotizacionesComponent } from './cotizaciones.component';
import { CotizacionesListComponent } from './components/cotizaciones-list/cotizaciones-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: CotizacionesComponent,
        children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            {
                path: 'list',
                component: CotizacionesListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'ADMINISTRACION_COTIZACIONES_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CotizacionesRoutingModule { }