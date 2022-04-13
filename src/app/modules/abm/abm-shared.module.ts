import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { FuseAlertModule } from "@fuse/components/alert";
import { FuseScrollbarModule } from "@fuse/directives/scrollbar";
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
    exports: [
        CommonModule,
        MatTabsModule,
        MatIconModule,
        MatTableModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSortModule,
        MatSelectModule,
        MatDialogModule,
        MatMenuModule,
        MatCheckboxModule,
        FuseAlertModule,
        FuseScrollbarModule,
        FormsModule,
        ReactiveFormsModule
    ]
})

export class ABMSharedModule {

}