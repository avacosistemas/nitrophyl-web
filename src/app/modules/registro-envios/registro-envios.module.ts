import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PromptsModule } from 'app/modules/prompts/prompts.modules';
import { HeaderSharedModule } from 'app/shared/header-shared.module'; 

import { RegistroEnviosComponent } from './components/registro-envios.component';
import { RegistroComponent } from './registro-envios.component';

const routes: Routes = [
    {
        path: '',
        component: RegistroComponent,
        children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            { 
                path: 'list', 
                component: RegistroEnviosComponent, 
                data: { subtitle: 'Registro de envíos' } 
            },
        ],
    },
];

@NgModule({
    declarations: [
        RegistroComponent,     
        RegistroEnviosComponent 
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        HeaderSharedModule, 

        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatAutocompleteModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        
        PromptsModule,
    ],
    providers: [
        DatePipe
    ]
})
export class RegistroEnviosModule { }