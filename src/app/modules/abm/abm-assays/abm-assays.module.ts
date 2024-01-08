import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMAssaysComponent } from './abm-assays.component';
import { AssaysComponent } from './assays/assays.component';

// * Dialogs.
import { AssayDialogComponent } from './assay-dialog/assay-dialog.component';

// * Material sidenav.
import { MatSidenavModule } from '@angular/material/sidenav';

// * Material datepicker.
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

const routes: Route[] = [
  {
    path: '',
    component: ABMAssaysComponent,
    children: [{ path: ':id', component: AssaysComponent }],
  },
];

@NgModule({
  declarations: [ABMAssaysComponent, AssaysComponent, AssayDialogComponent],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
})
export class ABMAssaysModule {}
