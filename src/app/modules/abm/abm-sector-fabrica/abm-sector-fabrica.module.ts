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
import { SharedModule } from 'app/shared/shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';

import { AbmSectorFabricaRoutingModule } from './abm-sector-fabrica-routing.module';
import { ABMSectorFabricaComponent } from './abm-sector-fabrica.component';
import { SectorFabricaListComponent } from './components/sector-fabrica-list/sector-fabrica-list.component';
import { SectorFabricaModalComponent } from './components/sector-fabrica-modal/sector-fabrica-modal.component';

@NgModule({
  declarations: [
    ABMSectorFabricaComponent,
    SectorFabricaListComponent,
    SectorFabricaModalComponent
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
    SharedModule,
    HeaderSharedModule,
    AbmSectorFabricaRoutingModule
  ]
})
export class ABMSectorFabricaModule { }
