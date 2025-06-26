import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ABMPiezaTipoComponent } from './abm-pieza-tipo.component';
import { PiezaTiposListComponent } from './components/pieza-tipos-list/pieza-tipos-list.component';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

const routes: Route[] = [
  {
    path: '',
    component: ABMPiezaTipoComponent,
    children: [
      { path: '', redirectTo: 'grid', pathMatch: 'full' },
      {
        path: 'grid',
        component: PiezaTiposListComponent,
        canActivate: [PermissionGuard],
        data: { permission: 'PIEZA_TIPO_READ' },
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AbmPiezaTipoRoutingModule { }