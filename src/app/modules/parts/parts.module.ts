import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMSharedModule } from '../abm/abm-shared.module';
import { PartsCrearCompuestaComponent } from './crear-compuesta/parts-crear-compuesta.component';
import { PartsCrearSimpleComponent } from './crear-simple/parts-crear-simple.component';
import { PartsGrillaComponent } from './grilla/parts-grilla.component';
import { PartsComponent } from './parts.component';

const partsRoutes: Route[] = [
    {
        path     : '',
        component: PartsComponent,
        children: [
            { path: 'grid', component: PartsGrillaComponent },
            { path: 'createSimple', component: PartsCrearSimpleComponent },
            { path: 'createSimple/:id', component: PartsCrearSimpleComponent },
            { path: 'createComposed', component: PartsCrearCompuestaComponent },
            { path: 'createComposed/:id', component: PartsCrearCompuestaComponent }
        ]
    }
];

@NgModule({
    declarations: [
        PartsComponent,
        PartsGrillaComponent,
        PartsCrearSimpleComponent,
        PartsCrearCompuestaComponent
    ],
    imports     : [
        RouterModule.forChild(partsRoutes),
        ABMSharedModule
    ]
})
export class PartsModule
{
}
