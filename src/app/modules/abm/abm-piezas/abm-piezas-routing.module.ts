import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ABMPiezasComponent } from './abm-piezas.component';
import { ABMPiezasGrillaComponent } from './components/grilla/abm-piezas-grilla.component';
import { ABMPiezaComponent } from './components/pieza/abm-pieza.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: ABMPiezasComponent,
    children: [
      {
        path: '',
        redirectTo: 'grid',
        pathMatch: 'full'
      },
      {
        path: 'grid',
        component: ABMPiezasGrillaComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PROCESOS_PIEZAS_READ' },
      },
      {
        path: 'create',
        component: ABMPiezaComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PROCESOS_PIEZAS_CREATE', mode: 'create' },
      },
      {
        path: ':id/edit',
        component: ABMPiezaComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PROCESOS_PIEZAS_EDIT', mode: 'edit' },
      },
      {
        path: ':id/view',
        component: ABMPiezaComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PROCESOS_PIEZAS_VIEW', mode: 'view' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ABMPiezasRoutingModule { }