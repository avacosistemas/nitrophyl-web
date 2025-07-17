import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMInsumosComponent } from './abm-insumos.component';
import { InsumosListComponent } from './components/insumos-list/insumos-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMInsumosComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: InsumosListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'INSUMOS_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmInsumosRoutingModule { }