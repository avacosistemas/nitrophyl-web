import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

// * Shared module.
import { ABMSharedModule } from '../abm-shared.module';

// * Components.
import { ABMFormulaComponent } from './abm-formula.component';
import { FormulasComponent } from './formulas/formulas.component.';
import { FormulaComponent } from './formula/formula.component';

const routes: Route[] = [
  {
    path: '',
    component: ABMFormulaComponent,
    children: [
      { path: 'grid', component: FormulasComponent },
      { path: 'create', component: FormulaComponent },
      { path: 'view/:id', component: FormulaComponent },
      { path: 'edit/:id', component: FormulaComponent },
    ],
  },
];

@NgModule({
  declarations: [ABMFormulaComponent, FormulasComponent, FormulaComponent],
  imports: [RouterModule.forChild(routes), ABMSharedModule],
})
export class ABMFormulaModule {}
