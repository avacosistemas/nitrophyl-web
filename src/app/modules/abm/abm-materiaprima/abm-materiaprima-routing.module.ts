import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMMateriaPrimaComponent } from './abm-materiaprima.component';
import { MateriaPrimaListComponent } from './components/materia-prima-list/materia-prima-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';
import { MateriaPrimaStockComponent } from './components/materia-prima-stock/materia-prima-stock.component';

const routes: Route[] = [
    {
        path: '',
        component: ABMMateriaPrimaComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: MateriaPrimaListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'MATERIA_PRIMA_READ' },
            },
            {
                path: 'stock/:id',
                component: MateriaPrimaStockComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'MATERIA_PRIMA_STOCK_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmMateriaPrimaRoutingModule { }