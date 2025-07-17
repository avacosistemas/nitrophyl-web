import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMInsumoTipoComponent } from './abm-insumo-tipo.component';
import { InsumoTipoListComponent } from './components/insumo-tipo-list/insumo-tipo-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMInsumoTipoComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: InsumoTipoListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'INSUMO_TIPO_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmInsumoTipoRoutingModule { }