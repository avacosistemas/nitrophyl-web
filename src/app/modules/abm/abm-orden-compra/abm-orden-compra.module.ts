import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { MatRadioModule } from '@angular/material/radio';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/shared/components/prompts.modules';

import { ABMOrdenCompraComponent } from './abm-orden-compra.component';
import { OrdenCompraListComponent } from './components/orden-compra-list/orden-compra-list.component';
import { OrdenCompraFormComponent } from './components/orden-compra-form/orden-compra-form.component';
import { OrdenCompraCancelModalComponent } from './components/orden-compra-cancel-modal/orden-compra-cancel-modal.component';
import { OrdenCompraHeaderComponent } from './components/orden-compra-form/headers/orden-compra-header.component';
import { OrdenCompraDetailsComponent } from './components/orden-compra-form/details/orden-compra-details.component';
import { OrdenCompraPendientesListComponent } from './components/orden-compra-pendientes-list/orden-compra-pendientes-list.component';
import { OrdenCompraPiezaFormComponent } from './components/orden-compra-form/details/pieza-form/orden-compra-pieza-form.component';
import { OrdenCompraPiezasListComponent } from './components/orden-compra-form/details/piezas-list/orden-compra-piezas-list.component';
import { OrdenCompraPiezaEditModalComponent } from './components/orden-compra-form/details/piezas-list/edit-modal/orden-compra-pieza-edit-modal.component';
import { MatTabsModule } from '@angular/material/tabs';

export const MY_DATE_FORMATS = {
    parse: {
        dateInput: ['DD/MM/YYYY', 'DD-MM-YYYY', 'D/M/YYYY', 'D-M-YYYY', 'YYYY-MM-DD']
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
        ABMOrdenCompraComponent,
        OrdenCompraListComponent,
        OrdenCompraFormComponent,
        OrdenCompraCancelModalComponent,
        OrdenCompraHeaderComponent,
        OrdenCompraDetailsComponent,
        OrdenCompraPendientesListComponent,
        OrdenCompraPiezaFormComponent,
        OrdenCompraPiezasListComponent,
        OrdenCompraPiezaEditModalComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
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
        MatCheckboxModule,
        MatRadioModule,
        MatTabsModule
    ],
    providers: [
        DatePipe,
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    ]
})
export class ABMOrdenCompraModule { }