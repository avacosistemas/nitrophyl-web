import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockConsultaComponent } from './components/stock-consulta/stock-consulta.component';
import { StockMovimientosComponent } from './components/stock-movimientos/stock-movimientos.component';

const routes: Routes = [
  { path: '', redirectTo: 'consulta', pathMatch: 'full' },
  { path: 'consulta', component: StockConsultaComponent },
  { path: 'movimientos', component: StockMovimientosComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StockRoutingModule {}
