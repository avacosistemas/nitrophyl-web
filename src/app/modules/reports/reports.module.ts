import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
// Components
import { GenerarInformesComponent } from './generar-informes/generar-informes.component';
import { ReportsComponent } from './reports.component';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ConfirmSendEmailDialogComponent } from './confirm-send-email-dialog/confirm-send-email-dialog.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PDFModalComponent } from './generar-informes/pdf-modal/pdf-modal.component';

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
const informesRoutes: Route[] = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      { path: '', redirectTo: 'generar-informes', pathMatch: 'full' },
      { path: 'generar-informes', component: GenerarInformesComponent, data: { subtitle: 'Generar Informe' } },
    ],
  },
];
@NgModule({
  declarations: [
    GenerarInformesComponent,
    ReportsComponent,
    ConfirmDialogComponent,
    ConfirmSendEmailDialogComponent,
    PDFModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(informesRoutes),
    HeaderSharedModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMomentDateModule,
    PdfViewerModule
  ],
  exports: [
    ConfirmDialogComponent,
    ConfirmSendEmailDialogComponent
  ],
  providers: [
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ]
})
export class ReportsModule { }