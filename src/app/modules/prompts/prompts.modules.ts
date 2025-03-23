import { NgModule } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ABMSharedModule } from '../abm/abm-shared.module';
import { ImgModalDialogComponent } from './img-modal/img-modal.component';
import { IngresoEgresoDialogComponent } from './ingreso-egreso/ingreso-egreso.component';
import { PDFModalDialogComponent } from './pdf-modal/pdf-modal.component';
import { RemoveDialogComponent } from './remove/remove.component';
import { ExportDataComponent } from './export-data/export-data.component';
import { MaterialModule } from '../../material.module';
import { DialogCustomComponent } from './dialog-custom/dialog-custom.component';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [
        RemoveDialogComponent,
        IngresoEgresoDialogComponent,
        PDFModalDialogComponent,
        ImgModalDialogComponent,
        ExportDataComponent,
        DialogCustomComponent,
    ],
    imports: [
        ABMSharedModule,
        PdfViewerModule,
        MaterialModule,
        CommonModule
    ],
    exports: [ExportDataComponent],
    entryComponents: [DialogCustomComponent]
})

export class PromptsModule { }