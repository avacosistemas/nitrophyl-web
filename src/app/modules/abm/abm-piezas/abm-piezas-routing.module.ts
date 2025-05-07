import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ABMPiezasComponent } from './abm-piezas.component';
import { ABMPiezasGrillaComponent } from './components/grilla/abm-piezas-grilla.component';
import { ABMPiezaComponent } from './components/pieza/abm-pieza.component';

const routes: Routes = [
  {
    path: '',
    component: ABMPiezasComponent,
    children: [
      { path: 'grid', component: ABMPiezasGrillaComponent },
      { path: 'create', component: ABMPiezaComponent, data: { mode: 'create' } },
      { path: ':id/edit', component: ABMPiezaComponent, data: { mode: 'edit' } },
      { path: ':id/view', component: ABMPiezaComponent, data: { mode: 'view' } },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ABMPiezasRoutingModule { }