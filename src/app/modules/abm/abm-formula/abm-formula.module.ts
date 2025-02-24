import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMFormulaComponent } from './abm-formula.component';
import { FormulasComponent } from './formulas/formulas.component';
import { FormulaComponent } from './formula/formula.component';

// * Fuse sidebar.
// import { FuseDrawerModule } from '@fuse/components/drawer';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FuseCardModule } from '@fuse/components/card';
import { MatIconModule } from '@angular/material/icon';
import { TestModifyDialogComponent } from 'app/modules/prompts/test-modify/test-modify-dialog.component';
import { CheckParamDialogComponent } from 'app/modules/prompts/check-param/check-param-dialog.component';
import { FormulaTestModalComponent } from './formula-test-modal/formula-test-modal.component';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { PromptsModule } from 'app/modules/prompts/prompts.modules';
import { MaterialModule } from 'app/material.module';

const routes: Route[] = [
  {
    path: '',
    component: ABMFormulaComponent,
    children: [
      { path: 'grid', component: FormulasComponent },
      { path: 'create', component: FormulaComponent },
      { path: 'view/:id', component: FormulaComponent },
      { path: 'edit/:id', component: FormulaComponent },
      { path: 'test/:id', component: FormulaComponent },
    ],
  },
];

@NgModule({
  declarations: [ABMFormulaComponent, FormulasComponent, FormulaComponent, FormulaTestModalComponent, TestModifyDialogComponent, CheckParamDialogComponent],
  imports: [RouterModule.forChild(routes), ABMSharedModule, MatSidenavModule, MatIconModule, FuseCardModule, HeaderSharedModule, PromptsModule, MaterialModule],
  entryComponents: [TestModifyDialogComponent, CheckParamDialogComponent]
})
export class ABMFormulaModule { }
