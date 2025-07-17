import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMPrensasComponent } from './abm-prensa.component';
import { PrensaListComponent } from './components/prensa-list/prensa-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMPrensasComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: PrensaListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'PRENSAS_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmPrensaRoutingModule { }