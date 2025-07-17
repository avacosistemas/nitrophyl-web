import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AbmInsumoTipoRoutingModule } from './abm-insumo-tipo-routing.module';

import { ABMInsumoTipoComponent } from './abm-insumo-tipo.component';
import { InsumoTipoListComponent } from './components/insumo-tipo-list/insumo-tipo-list.component';
import { InsumoTipoModalComponent } from './components/insumo-tipo-modal/insumo-tipo-modal.component';

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
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';


@NgModule({
    declarations: [
        ABMInsumoTipoComponent,
        InsumoTipoListComponent,
        InsumoTipoModalComponent
    ],
    imports: [
        CommonModule,
        AbmInsumoTipoRoutingModule,
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
        MatAutocompleteModule,
    ]
})
export class ABMInsumoTipoModule { }