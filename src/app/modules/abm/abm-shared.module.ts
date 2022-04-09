import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { FuseAlertModule } from "@fuse/components/alert";

@NgModule({
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        FuseAlertModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatSortModule
    ],
    exports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        FuseAlertModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatSortModule
    ]
})

export class ABMSharedModule {

}