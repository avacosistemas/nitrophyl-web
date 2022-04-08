import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { ABMPerfilesComponent } from './abm-perfiles.component';
import { ABMPerfilesDialog } from './dialog/abm-perfiles-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { FuseAlertModule } from '@fuse/components/alert';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

const abmPerfilesRoutes: Route[] = [
    {
        path     : '',
        component: ABMPerfilesComponent
    }
];

@NgModule({
    declarations: [
        ABMPerfilesComponent,
        ABMPerfilesDialog
    ],
    imports     : [
        RouterModule.forChild(abmPerfilesRoutes),
        CommonModule,
        MatTableModule,
        MatButtonModule,
        FuseAlertModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule
    ]
})
export class ABMPerfilesModule
{
}
