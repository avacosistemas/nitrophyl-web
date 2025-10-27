import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbmMateriaPrimaRoutingModule } from './abm-materiaprima-routing.module';

import { ABMMateriaPrimaComponent } from './abm-materiaprima.component';
import { MateriaPrimaListComponent } from './components/materia-prima-list/materia-prima-list.component';
import { MateriaPrimaModalComponent } from './components/materia-prima-modal/materia-prima-modal.component';

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

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';


@NgModule({
    declarations: [
        ABMMateriaPrimaComponent,
        MateriaPrimaListComponent,
        MateriaPrimaModalComponent
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
    ]
})
export class ABMMateriaPrimaModule { }