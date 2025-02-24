import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GenerarInformesComponent } from './generar-informes/generar-informes.component';
import { ReportsComponent } from './reports.component';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

const informesRoutes: Route[] = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      { path: '', redirectTo: 'generar-informes', pathMatch: 'full' },
      { path: 'generar-informes', component: GenerarInformesComponent,  data: { subtitle: 'Generar Informe' } },
    ],
  },
];

@NgModule({
  declarations: [
    GenerarInformesComponent,
    ReportsComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    RouterModule.forChild(informesRoutes),
    HeaderSharedModule,
    MatDialogModule
  ],
  exports: [
    ConfirmDialogComponent
  ],
})
export class ReportsModule { }
