import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { IConfig, NgxMaskModule } from 'ngx-mask';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMClientesComponent } from './abm-clientes.component';
import { ABMClientesContactoComponent } from './contacto/abm-clientes-contacto.component';
import { ABMClientesCrearComponent } from './crear-cliente/abm-clientes-crear.component';
import { ABMClientesCrearContactoComponent } from './crear-contacto/abm-clientes-crear-contacto.component';
import { ABMClientesGrillaContactosComponent } from './grilla-contactos/abm-clientes-grilla-contactos.component';
import { ABMClientesGrillaComponent } from './grilla/abm-clientes-grilla.component';
import { ABMClientesGrillaDomiciliosComponent } from './grilla-domicilios/abm-clientes-grilla-domicilios.component';
import { ABMClientesCrearDomicilioComponent } from './crear-domicilio/abm-clientes-crear-domicilio.component';
import { ABMClientesDomicilioComponent } from './domicilio/abm-clientes-domicilio.component';

// * Material.
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { CoreSharedModule } from 'app/core/shared/shared.module';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';
import { MaterialModule } from 'app/material.module';

const abmUsuariosRoutes: Route[] = [
  {
    path: '',
    component: ABMClientesComponent,
    children: [
      {
        path: '',
        redirectTo: 'grid',
        pathMatch: 'full'
      },
      {
        path: 'grid',
        component: ABMClientesGrillaComponent,
        data: { permission: 'MENU_ADMINISTRACION_CLIENTES' },
        canActivate: [PermissionGuard]
      },
      {
        path: 'create',
        component: ABMClientesCrearComponent,
      },
      {
        path: ':idCliente/grid-contactos',
        component: ABMClientesGrillaContactosComponent,
      },
      {
        path: ':idCliente/crear-contacto',
        component: ABMClientesCrearContactoComponent,
      },
      {
        path: ':idCliente/contacto/:idContacto',
        component: ABMClientesContactoComponent
      },
      {
        path: ':idCliente/grid-domicilios',
        component: ABMClientesGrillaDomiciliosComponent,
      },
      {
        path: ':idCliente/crear-domicilio',
        component: ABMClientesCrearDomicilioComponent,
      },
      {
        path: ':idCliente/domicilio/:idDomicilio',
        component: ABMClientesDomicilioComponent
      },
    ],
  },
];

const maskConfig: Partial<IConfig> = {
  showMaskTyped: true,
};

@NgModule({
  declarations: [
    ABMClientesComponent,
    ABMClientesGrillaComponent,
    ABMClientesCrearComponent,
    ABMClientesGrillaContactosComponent,
    ABMClientesCrearContactoComponent,
    ABMClientesContactoComponent,
    ABMClientesGrillaDomiciliosComponent,
    ABMClientesCrearDomicilioComponent,
    ABMClientesDomicilioComponent,
  ],
  imports: [
    RouterModule.forChild(abmUsuariosRoutes),
    ABMSharedModule,
    NgxMaskModule.forRoot(maskConfig),
    MatSlideToggleModule,
    CoreSharedModule,
    HeaderSharedModule,
    PromptsModule,
    MaterialModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatCheckboxModule,
  ],
})
export class ABMClientesModule { }
