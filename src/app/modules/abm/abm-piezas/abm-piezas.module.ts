import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ABMPiezasRoutingModule } from './abm-piezas-routing.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ABMPiezasComponent } from './abm-piezas.component';
import { ABMPiezasGrillaComponent } from './components/grilla/abm-piezas-grilla.component';
import { ABMPiezaCrearEditarComponent } from './components/crear-editar/abm-pieza-crear-editar.component';
import { RevisionInicialInputComponent } from './components/crear-editar/revision-inicial-input.component';
import { ABMPiezaComponent } from './components/pieza/abm-pieza.component';
import { ABMPiezaMoldesComponent } from './components/moldes/abm-pieza-moldes.component';
import { ABMPiezaInsumosComponent } from './components/insumos/abm-pieza-insumos.component';
import { ABMPiezaDimensionesComponent } from './components/dimensiones/abm-pieza-dimensiones.component';
import { ABMPiezaClientesComponent } from './components/clientes/abm-pieza-clientes.component';
import { ABMPiezaPlanosComponent } from './components/planos/abm-pieza-planos.component';
import { ABMPiezaMoldeoComponent } from './components/moldeo/abm-pieza-moldeo.component';
import { ABMPiezaDesmoldantePostcuraComponent } from './components/desmoldante-postcura/abm-pieza-desmoldante-postcura.component';
import { ABMPiezaEsquemaComponent } from './components/esquema/abm-pieza-esquema.component';
import { ABMPiezaFinalizacionComponent } from './components/finalizacion/abm-pieza-finalizacion.component';
import { SharedModule } from 'app/shared/shared.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from '../../prompts/prompts.modules';
import { ABMPiezaInsumoModalFormModule } from './components/insumos/modal-form/abm-pieza-insumos-modal-form.module';
import { ABMPiezaEsquemaModalModule } from './components/esquema/modal-form/abm-pieza-esquema-modal.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ABMPiezaModalPlanoModule } from './components/planos/modal-plano/abm-pieza-plano-modal.module';
import { MatCheckboxModule } from "@angular/material/checkbox";

@NgModule({
  declarations: [
    ABMPiezasComponent,
    ABMPiezaComponent,
    ABMPiezaMoldesComponent,
    ABMPiezasGrillaComponent,
    ABMPiezaCrearEditarComponent,
    RevisionInicialInputComponent,
    ABMPiezaInsumosComponent,
    ABMPiezaDimensionesComponent,
    ABMPiezaClientesComponent,
    ABMPiezaPlanosComponent,
    ABMPiezaMoldeoComponent,
    ABMPiezaDesmoldantePostcuraComponent,
    ABMPiezaEsquemaComponent,
    ABMPiezaFinalizacionComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ABMPiezasRoutingModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    SharedModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    HeaderSharedModule,
    PromptsModule,
    ABMPiezaInsumoModalFormModule,
    ABMPiezaEsquemaModalModule,
    MatDialogModule,
    MatSlideToggleModule,
    ABMPiezaModalPlanoModule
  ]
})
export class ABMPiezasModule { }