import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMMachineComponent } from './abm-machine.component';
import { MachinesComponent } from './machines/machines.component.';
import { MachineComponent } from './machine/machine.component';

const routes: Route[] = [
  {
    path: '',
    component: ABMMachineComponent,
    children: [
      { path: 'grid', component: MachinesComponent },
      { path: 'create', component: MachineComponent },
      { path: 'view/:id', component: MachineComponent },
      { path: 'edit/:id', component: MachineComponent },
      { path: 'test/:id', component: MachineComponent },
    ],
  },
];

@NgModule({
  declarations: [
      ABMMachineComponent, 
      MachinesComponent, 
      MachineComponent
  ],
  imports: [
    RouterModule.forChild(routes), 
    ABMSharedModule
  ],
})
export class ABMMachineModule {}
