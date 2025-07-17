import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMTratamientosComponent } from './abm-tratamiento.component';
import { TratamientoListComponent } from './components/tratamiento-list/tratamiento-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
    {
        path: '',
        component: ABMTratamientosComponent,
        children: [
            { path: '', redirectTo: 'grid', pathMatch: 'full' },
            {
                path: 'grid',
                component: TratamientoListComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'TRATAMIENTOS_READ' },
            }
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AbmTratamientoRoutingModule { }