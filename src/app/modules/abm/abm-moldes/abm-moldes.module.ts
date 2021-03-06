import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMMoldesComponent } from './abm-moldes.component';
import { ABMMoldesCrear } from './crear-molde/abm-moldes-crear.component';
import { ABMMoldesGrillaComponent } from './grilla/abm-moldes-grilla.component.';
import { ABMMoldesMolde } from './molde/abm-moldes-molde.component';

const abmUsuariosRoutes: Route[] = [
    {
        path     : '',
        component: ABMMoldesComponent,
        children: [
            { path: 'grid', component: ABMMoldesGrillaComponent },
            { path: 'create', component: ABMMoldesCrear },
            { path: 'molde/:id', component: ABMMoldesMolde }
        ]
    }
];

@NgModule({
    declarations: [
        ABMMoldesComponent,
        ABMMoldesGrillaComponent,
        ABMMoldesMolde,
        ABMMoldesCrear
    ],
    imports     : [
        RouterModule.forChild(abmUsuariosRoutes),
        ABMSharedModule
    ]
})
export class ABMMoldesModule
{
}
