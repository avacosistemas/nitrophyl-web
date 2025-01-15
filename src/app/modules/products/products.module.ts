import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ABMSharedModule } from '../abm/abm-shared.module';
import { HeaderSharedModule } from 'app/shared/header-shared.module';
import { ProductsCrearCompuestaComponent } from './crear-compuesta/products-crear-compuesta.component';
import { ProductsCrearSimpleComponent } from './crear-simple/products-crear-simple.component';
import { ProductsGrillaComponent } from './grilla/products-grilla.component';
import { ProductsComponent } from './products.component';
import { MatExpansionModule } from '@angular/material/expansion';

const productsRoutes: Route[] = [
    {
        path     : '',
        component: ProductsComponent,
        children: [
            { path: 'grid', component: ProductsGrillaComponent },
            { path: 'createSimple', component: ProductsCrearSimpleComponent },
            { path: 'createSimple/:id', component: ProductsCrearSimpleComponent },
            { path: 'createComposed', component: ProductsCrearCompuestaComponent },
            { path: 'createComposed/:id', component: ProductsCrearCompuestaComponent }
        ]
    }
];

@NgModule({
    declarations: [
        ProductsComponent,
        ProductsGrillaComponent,
        ProductsCrearSimpleComponent,
        ProductsCrearCompuestaComponent
  ],
    imports     : [
        RouterModule.forChild(productsRoutes),
        ABMSharedModule,
        HeaderSharedModule,
        MatExpansionModule
    ]
})
export class ProductsModule
{
}
