import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { PermissionDeniedComponent } from 'app/modules/admin/permission-denied/permission-denied.component';

const permissionDeniedRoutes: Route[] = [
    {
        path     : '',
        component: PermissionDeniedComponent
    }
];

@NgModule({
    declarations: [
        PermissionDeniedComponent
    ],
    imports     : [
        RouterModule.forChild(permissionDeniedRoutes),
        MatButtonModule,
        FuseCardModule,
        SharedModule
    ]
})
export class PermissionDeniedModule
{
}
