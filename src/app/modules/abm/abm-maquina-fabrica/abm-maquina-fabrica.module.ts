import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { SharedModule } from 'app/shared/shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';

import { AbmMaquinaFabricaRoutingModule } from './abm-maquina-fabrica-routing.module';
import { ABMMaquinaFabricaComponent } from './abm-maquina-fabrica.component';
import { MaquinaFabricaListComponent } from './components/maquina-fabrica-list/maquina-fabrica-list.component';
import { MaquinaFabricaModalComponent } from './components/maquina-fabrica-modal/maquina-fabrica-modal.component';

@NgModule({
  declarations: [
    ABMMaquinaFabricaComponent,
    MaquinaFabricaListComponent,
    MaquinaFabricaModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule,
    SharedModule,
    HeaderSharedModule,
    AbmMaquinaFabricaRoutingModule
  ]
})
export class ABMMaquinaFabricaModule { }
