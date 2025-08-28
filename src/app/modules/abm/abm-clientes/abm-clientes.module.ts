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

// * Material.
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
  ],
  imports: [
    RouterModule.forChild(abmUsuariosRoutes),
    ABMSharedModule,
    NgxMaskModule.forRoot(maskConfig),
    MatSlideToggleModule,
    CoreSharedModule,
    HeaderSharedModule,
    PromptsModule,
    MaterialModule
  ],
})
export class ABMClientesModule { }
