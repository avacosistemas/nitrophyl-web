import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ABMOrdenFabricacionRoutingModule } from './abm-orden-fabricacion-routing.module';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';

import { ABMOrdenFabricacionComponent } from './abm-orden-fabricacion.component';
import { OrdenFabricacionListComponent } from './components/orden-fabricacion-list/orden-fabricacion-list.component';
import { OrdenFabricacionFormComponent } from './components/orden-fabricacion-form/orden-fabricacion-form.component';
import { AsignarPrensaDialogComponent } from './components/dialogs/asignar-prensa-dialog.component';
import { FinalizarOrdenDialogComponent } from './components/dialogs/finalizar-orden-dialog.component';

@NgModule({
    declarations: [
        ABMOrdenFabricacionComponent,
        OrdenFabricacionListComponent,
        OrdenFabricacionFormComponent,
        AsignarPrensaDialogComponent,
        FinalizarOrdenDialogComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ABMOrdenFabricacionRoutingModule,
        HeaderSharedModule,
        PromptsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatExpansionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatSelectModule,
        MatCheckboxModule
    ],
    providers: [
        DatePipe
    ]
})
export class ABMOrdenFabricacionModule { }