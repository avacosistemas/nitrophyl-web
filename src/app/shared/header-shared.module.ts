import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from 'app/layout/common/header/header.component';

@NgModule({
    declarations: [
        HeaderComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule
    ],
    exports: [
        HeaderComponent
    ]
})
export class HeaderSharedModule { }
