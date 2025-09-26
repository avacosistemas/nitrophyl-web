import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatMomentDateModule, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { CotizacionesRoutingModule } from './cotizaciones-routing.module';

import { CotizacionesComponent } from './cotizaciones.component';
import { CotizacionesListComponent } from './components/cotizaciones-list/cotizaciones-list.component';
import { CotizacionModalComponent } from './components/cotizacion-modal/cotizacion-modal.component';

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
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CurrencyPipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';

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

@NgModule({
    declarations: [
        CotizacionesComponent,
        CotizacionesListComponent,
        CotizacionModalComponent
    ],
    imports: [
        CommonModule,
        CotizacionesRoutingModule,
        HttpClientModule,
        ReactiveFormsModule,

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
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatMomentDateModule
    ],
    providers: [
        CurrencyPipe,
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE],
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    ]
})
export class CotizacionesModule { }