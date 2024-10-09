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
import { VerInformesComponent } from './ver-informes/ver-informes.component';
import { ReportsComponent } from './reports.component';

const informesRoutes: Route[] = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      { path: '', redirectTo: 'generar-informes', pathMatch: 'full' },
      { path: 'generar-informes', component: GenerarInformesComponent,  data: { subtitle: 'Generar Informe' } },
      { path: 'ver-informes', component: VerInformesComponent, data: { subtitle: 'Ver Informe' } },
    ],
  },
];

@NgModule({
  declarations: [
    GenerarInformesComponent,
    VerInformesComponent,
    ReportsComponent,
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
  ],
})
export class ReportsModule { }