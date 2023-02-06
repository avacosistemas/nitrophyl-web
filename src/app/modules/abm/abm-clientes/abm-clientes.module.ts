import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMClientesComponent } from './abm-clientes.component';
import { ABMClientesCrearContactoComponent } from './crear-contacto/abm-clientes-crear-contacto.component';
import { ABMClientesCrearComponent } from './crear-cliente/abm-clientes-crear.component';
import { ABMClientesGrillaContactosComponent } from './grilla-contactos/abm-clientes-grilla-contactos.component';
import { ABMClientesGrillaComponent } from './grilla/abm-clientes-grilla.component';
import { ABMClientesContactoComponent } from './contacto/abm-clientes-contacto.component';
import { NgxMaskModule, IConfig } from 'ngx-mask';

const abmUsuariosRoutes: Route[] = [
    {
        path     : '',
        component: ABMClientesComponent,
        children: [
            { path: 'grid', component: ABMClientesGrillaComponent },
            { path: 'create', component: ABMClientesCrearComponent },
            { path: ':idCliente/grid-contactos', component: ABMClientesGrillaContactosComponent },
            { path: ':idCliente/crear-contacto', component: ABMClientesCrearContactoComponent },
            { path: ':idCliente/contacto/:idContacto', component: ABMClientesContactoComponent },
        ]
    }
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
        ABMClientesContactoComponent
    ],
    imports     : [
        RouterModule.forChild(abmUsuariosRoutes),
        ABMSharedModule,
        NgxMaskModule.forRoot(maskConfig),
    ]
})
export class ABMClientesModule
{
}
