import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Route } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HeaderSharedModule } from 'app/shared/header-shared.module';

import { MaquinasComponent } from './maquinas/maquinas.component';

const routes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'maquinas'
  },
  {
    path: 'maquinas',
    component: MaquinasComponent
  }
];

@NgModule({
  declarations: [
    MaquinasComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgApexchartsModule,
    HeaderSharedModule
  ]
})
export class MonitoreoModule { }
