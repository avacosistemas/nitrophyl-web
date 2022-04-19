import { NgModule } from "@angular/core";
import { ABMSharedModule } from "../abm/abm-shared.module";
import { RemoveDialogComponent } from "./remove/remove.component";

@NgModule({
    declarations: [
        RemoveDialogComponent
    ],
    imports: [
        ABMSharedModule
    ]
})

export class PromptsModule {

}