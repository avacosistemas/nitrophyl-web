import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-orden-compra-cancel-choice-modal',
    templateUrl: './orden-compra-cancel-choice-modal.component.html'
})
export class OrdenCompraCancelChoiceModalComponent {
    @Input() comprobante: string = '';
    @Input() id!: number;

    constructor(public dialogRef: MatDialogRef<any>) {}

    selectAction(action: 'cancelar_total' | 'cancelar_items'): void {
        this.dialogRef.close(action);
    }

    getValue(): any {
        return null;
    }
}
