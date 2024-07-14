import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { GRIDMonitorComponent } from './grid-monitor.component';
import { MonitorComponent } from './monitor/monitor.component';

// * Material sidenav.
import { MatSidenavModule } from '@angular/material/sidenav';

// * Material datepicker.
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

// * Pipes.
import { DatePipe } from '@angular/common';
import { BridgeMonitorComponent } from './monitor/bridge-monitor.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

const routes: Route[] = [
  {
    path: '',
    component: GRIDMonitorComponent,
    children: [{ path: 'grid', component: MonitorComponent },
               { path: 'full', component: BridgeMonitorComponent }],
  },
];

@NgModule({
  declarations: [GRIDMonitorComponent, MonitorComponent, BridgeMonitorComponent],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, DatePipe],
})
export class GRIDMonitorModule {}
