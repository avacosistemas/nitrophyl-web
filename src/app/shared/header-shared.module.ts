// shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { RouterModule } from '@angular/router'; // Importa RouterModule si usas routerLink en el breadcrumb
import { MatIconModule } from '@angular/material/icon'; // Importa MatIconModule si usas íconos de Material
import { MatButtonModule } from '@angular/material/button'; // Importa MatButtonModule si usas botones de Material
import { HeaderComponent } from 'app/layout/common/header/header.component'; // La ruta a tu componente

@NgModule({
    declarations: [
        HeaderComponent
    ],
    imports: [
        CommonModule,
        RouterModule, // Si usas routerLink
        MatIconModule, // Si usas íconos de Material
        MatButtonModule // Si usas botones de Material
    ],
    exports: [
        HeaderComponent // Exporta el componente para que esté disponible en otros módulos
    ]
})
export class HeaderSharedModule {}
