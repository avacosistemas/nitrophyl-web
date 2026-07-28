import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { SharedModule } from 'app/shared/shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/shared/components/prompts.modules';
import { AbmTransportesRoutingModule } from './abm-transportes-routing.module';
import { ABMTransportesComponent } from './abm-transportes.component';
import { TransportesListComponent } from './components/transportes-list/transportes-list.component';
import { TransporteModalComponent } from './components/transporte-modal/transporte-modal.component';

@NgModule({
    declarations: [
        ABMTransportesComponent,
        TransportesListComponent,
        TransporteModalComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        ReactiveFormsModule,
        FormsModule,
        
        HeaderSharedModule,
        PromptsModule,

        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatTooltipModule,
        MatSnackBarModule,
        SharedModule,
        AbmTransportesRoutingModule
    ]
})
export class ABMTransportesModule { }

