import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbmMateriaPrimaRoutingModule } from './abm-materiaprima-routing.module';

import { ABMMateriaPrimaComponent } from './abm-materiaprima.component';
import { MateriaPrimaListComponent } from './components/materia-prima-list/materia-prima-list.component';
import { MateriaPrimaModalComponent } from './components/materia-prima-modal/materia-prima-modal.component';
import { MateriaPrimaStockComponent } from './components/materia-prima-stock/materia-prima-stock.component';
import { MateriaPrimaStockModalComponent } from './components/materia-prima-stock-modal/materia-prima-stock-modal.component';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';
import { CoreSharedModule } from 'app/core/shared/shared.module';

@NgModule({
    declarations: [
        ABMMateriaPrimaComponent,
        MateriaPrimaListComponent,
        MateriaPrimaModalComponent,
        MateriaPrimaStockComponent,
        MateriaPrimaStockModalComponent
    ],
    imports: [
        CommonModule,
        AbmMateriaPrimaRoutingModule,
        HttpClientModule,
        ReactiveFormsModule,
        FormsModule,

        HeaderSharedModule,
        PromptsModule,

        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatSlideToggleModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        CoreSharedModule
    ]
})
export class ABMMateriaPrimaModule { }