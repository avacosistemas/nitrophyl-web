import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMAssaysComponent } from './abm-assays.component';
import { AssaysComponent } from './assays/assays.component';

// * Dialogs.
import { AssayDialogComponent } from './assay-dialog/assay-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './assay-dialog-confirm/assay-dialog-confirm.component';

// * Material sidenav.
import { MatSidenavModule } from '@angular/material/sidenav';

// * Material datepicker.
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

// * Pipes.
import { DatePipe } from '@angular/common';

import { HeaderSharedModule } from 'app/shared/header-shared.module';

const routes: Route[] = [
  {
    path: '',
    component: ABMAssaysComponent,
    children: [{ path: ':id', component: AssaysComponent }],
  },
];

@NgModule({
  declarations: [
    ABMAssaysComponent,
    AssaysComponent,
    AssayDialogComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    HeaderSharedModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, DatePipe],
})
export class ABMAssaysModule {}
