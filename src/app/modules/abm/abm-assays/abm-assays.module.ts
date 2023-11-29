import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMAssaysComponent } from './abm-assays.component';
import { AssaysComponent } from './assays/assays.component';

// * Material sidenav.
import { MatSidenavModule } from '@angular/material/sidenav';

const routes: Route[] = [
  {
    path: '',
    component: ABMAssaysComponent,
    children: [{ path: ':id', component: AssaysComponent }],
  },
];

@NgModule({
  declarations: [ABMAssaysComponent, AssaysComponent],
  imports: [RouterModule.forChild(routes), ABMSharedModule, MatSidenavModule],
})
export class ABMAssaysModule {}
