import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbmTratamientoRoutingModule } from './abm-tratamiento-routing.module';

import { ABMTratamientosComponent } from './abm-tratamiento.component';
import { TratamientoListComponent } from './components/tratamiento-list/tratamiento-list.component';
import { TratamientoModalComponent } from './components/tratamiento-modal/tratamiento-modal.component';

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
        ABMTratamientosComponent,
        TratamientoListComponent,
        TratamientoModalComponent
    ],
    imports: [
        CommonModule,
        AbmTratamientoRoutingModule,
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
    ]
})
export class ABMTratamientosModule { }