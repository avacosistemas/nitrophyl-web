import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMPerfilesComponent } from './abm-perfiles.component';
import { ABMPerfilesDialog } from './dialog/abm-perfiles-dialog.component';
import { ABMSharedModule } from '../abm-shared.module';
import { ABMCrearPerfilDialog } from './dialog-crear/abm-perfiles-crear-dialog.component';

const abmPerfilesRoutes: Route[] = [
    {
        path     : '',
        component: ABMPerfilesComponent
    }
];

@NgModule({
    declarations: [
        ABMPerfilesComponent,
        ABMPerfilesDialog,
        ABMCrearPerfilDialog
    ],
    imports     : [
        RouterModule.forChild(abmPerfilesRoutes),
        ABMSharedModule
    ]
})
export class ABMPerfilesModule
{
}
