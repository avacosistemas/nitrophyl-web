import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
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
      {
        path: '',
        redirectTo: 'grid',
        pathMatch: 'full'
      },
      { path: 'grid', component: MachinesComponent },
      { path: 'create', component: MachineComponent },
      { path: 'view/:id', component: MachineComponent },
      { path: 'edit/:id', component: MachineComponent },
      { path: 'test/:id', component: MachineComponent },
    ],
  },
];

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

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
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
})
export class ABMMachineModule { }
