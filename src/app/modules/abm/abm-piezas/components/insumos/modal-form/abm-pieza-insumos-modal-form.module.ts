import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { ABMPiezaInsumoModalFormComponent } from './abm-pieza-insumo-modal-form.component';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [ABMPiezaInsumoModalFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTabsModule,
  ],
  exports: [ABMPiezaInsumoModalFormComponent],
})
export class ABMPiezaInsumoModalFormModule { }