import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';

// * Components.
import { ABMLotsComponent } from './abm-lots.component';
import { LotsComponent } from './lots/lots.component';

// * Material sidenav.
import { MatSidenavModule } from '@angular/material/sidenav';

// * Dialogs.
import { LotDialogComponent } from './lot-dialog/lot-dialog.component';

// * Material datepicker.
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

// * Pipes.
import { DatePipe } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';

const routes: Route[] = [
  {
    path: '',
    component: ABMLotsComponent,
    children: [{ path: 'grid', component: LotsComponent }],
  },
];

@NgModule({
  declarations: [ABMLotsComponent, LotsComponent, LotDialogComponent],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    HeaderSharedModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, DatePipe],
})
export class ABMLotsModule {}
