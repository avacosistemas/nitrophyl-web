import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMAdhesivosComponent } from './abm-adhesivos.component';
import { AdhesivosListComponent } from './components/adhesivos-list/adhesivos-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMAdhesivosComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: AdhesivosListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'ADHESIVOS_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmAdhesivosRoutingModule { }