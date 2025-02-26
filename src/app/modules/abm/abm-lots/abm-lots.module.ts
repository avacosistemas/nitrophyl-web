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
import { LotGraphicDialogComponent } from './lot-graphic-dialog/lot-graphic-dialog.component';

// * Material datepicker.
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

// * Pipes.
import { DatePipe } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';

import { LotModalComponent } from './lot-modal/lot-modal.component';

import { A11yModule } from '@angular/cdk/a11y';
import { LotUpdateService } from 'app/shared/services/lot-update.service';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';
import { MaterialModule } from 'app/material.module';

const routes: Route[] = [
  {
    path: '',
    component: ABMLotsComponent,
    children: [{ path: 'grid', component: LotsComponent }],
  },
];

@NgModule({
  declarations: [
    ABMLotsComponent,
    LotsComponent,
    LotDialogComponent,
    LotModalComponent,
    LotGraphicDialogComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    ABMSharedModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    HeaderSharedModule,
    A11yModule,
    MatDialogModule,
    PromptsModule,
    MaterialModule
  ],
  providers: [
    LotsComponent,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    DatePipe,
    LotUpdateService
  ],
  entryComponents: [
    LotModalComponent,
    LotDialogComponent,
    LotGraphicDialogComponent
  ]
})
export class ABMLotsModule { }
