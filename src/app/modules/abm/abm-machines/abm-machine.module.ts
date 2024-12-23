import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';

// * Components.
import { ABMMachineComponent } from './abm-machine.component';
import { MachinesComponent } from './machines/machines.component';
import { MachineComponent } from './machine/machine.component';
import { CoreSharedModule } from 'app/core/shared/shared.module';

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
      MachineComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    DragDropModule,
    CoreSharedModule,
    HeaderSharedModule
  ],
})
export class ABMMachineModule {}
