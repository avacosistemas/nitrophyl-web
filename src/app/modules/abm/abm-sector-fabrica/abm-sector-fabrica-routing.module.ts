import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMSectorFabricaComponent } from './abm-sector-fabrica.component';
import { SectorFabricaListComponent } from './components/sector-fabrica-list/sector-fabrica-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMSectorFabricaComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: SectorFabricaListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'SECTORES_FABRICA_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmSectorFabricaRoutingModule { }
