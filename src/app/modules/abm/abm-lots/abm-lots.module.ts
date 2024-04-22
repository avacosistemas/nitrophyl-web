import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

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
import { EditLotComponent } from './edit-lots/EditLot/EditLot.component';

const routes: Route[] = [
  {
    path: '',
    component: ABMLotsComponent,
    children: [{ path: 'grid', component: LotsComponent }],
  },
];

@NgModule({
  declarations: [ABMLotsComponent, LotsComponent, LotDialogComponent, EditLotComponent],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, DatePipe],
})
export class ABMLotsModule {}
