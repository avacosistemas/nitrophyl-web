import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMConfiguracionComponent } from './abm-configuracion.component';
import { ConfiguracionesComponent } from './configuraciones/configuraciones.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { MatPaginatorModule } from '@angular/material/paginator';

const abmConfiguracionRoutes: Route[] = [
    {
        path: '',
        component: ABMConfiguracionComponent,
        children: [
            { path: 'grid', component: ConfiguracionesComponent },
            { path: 'create', component: ConfiguracionComponent },
            { path: 'view/:id', component: ConfiguracionComponent },
            { path: 'edit/:id', component: ConfiguracionComponent },
        ]
    }
];

@NgModule({
    declarations: [
        ABMConfiguracionComponent,
        ConfiguracionComponent,
        ConfiguracionesComponent,
    ],
    imports: [
        RouterModule.forChild(abmConfiguracionRoutes),
        ABMSharedModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule
    ]
})
export class ABMConfiguracionModule { }
