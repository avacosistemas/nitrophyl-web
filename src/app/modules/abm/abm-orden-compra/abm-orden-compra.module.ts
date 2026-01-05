import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ABMOrdenCompraRoutingModule } from './abm-orden-compra-routing.module';

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
import { MatMomentDateModule, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';

import { ABMOrdenCompraComponent } from './abm-orden-compra.component';
import { OrdenCompraListComponent } from './components/orden-compra-list/orden-compra-list.component';
import { OrdenCompraFormComponent } from './components/orden-compra-form/orden-compra-form.component';

export const MY_DATE_FORMATS = {
    parse: { dateInput: 'DD/MM/YYYY' },
    display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

@NgModule({
    declarations: [
        ABMOrdenCompraComponent,
        OrdenCompraListComponent,
        OrdenCompraFormComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ABMOrdenCompraRoutingModule,
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
        DatePipe,
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    ]
})
export class ABMOrdenCompraModule { }