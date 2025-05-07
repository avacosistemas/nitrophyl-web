import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ABMPiezaPlanoModalComponent } from './abm-pieza-plano-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    declarations: [
        ABMPiezaPlanoModalComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatSelectModule,
        MatDialogModule
    ],
    exports: [
        ABMPiezaPlanoModalComponent
    ]
})
export class ABMPiezaModalPlanoModule { }