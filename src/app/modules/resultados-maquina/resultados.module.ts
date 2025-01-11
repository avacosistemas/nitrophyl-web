import { NgModule, LOCALE_ID } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { VerInformesComponent } from './ver-informes/ver-informes.component';
import { ResultadosComponent } from './resultados.component';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSortModule } from '@angular/material/sort';

registerLocaleData(localeEs);

const resultadosRoutes: Route[] = [
  {
    path: '',
    component: ResultadosComponent,
    children: [
      { path: '', redirectTo: 'maquina', pathMatch: 'full' },
      {
        path: 'maquina',
        component: VerInformesComponent,
        data: { subtitle: 'Resultados' },
      },
    ],
  },
];

@NgModule({
  declarations: [
    VerInformesComponent,
    ResultadosComponent,
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
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    RouterModule.forChild(resultadosRoutes),
    HeaderSharedModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatSortModule
  ],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class ResultadosModule { }
