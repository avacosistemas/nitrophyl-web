import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMMaquinaFabricaComponent } from './abm-maquina-fabrica.component';
import { MaquinaFabricaListComponent } from './components/maquina-fabrica-list/maquina-fabrica-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMMaquinaFabricaComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: MaquinaFabricaListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'MAQUINAS_FABRICA_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmMaquinaFabricaRoutingModule { }
