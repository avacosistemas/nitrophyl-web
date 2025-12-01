import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbmAdhesivosRoutingModule } from './abm-adhesivos-routing.module';

import { ABMAdhesivosComponent } from './abm-adhesivos.component';
import { AdhesivosListComponent } from './components/adhesivos-list/adhesivos-list.component';
import { AdhesivoModalComponent } from './components/adhesivo-modal/adhesivo-modal.component';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';


@NgModule({
    declarations: [
        ABMAdhesivosComponent,
        AdhesivosListComponent,
        AdhesivoModalComponent
    ],
    imports: [
        CommonModule,
        AbmAdhesivosRoutingModule,
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
    ],
    exports: [
        AdhesivoModalComponent
    ]
})
export class ABMAdhesivosModule { }