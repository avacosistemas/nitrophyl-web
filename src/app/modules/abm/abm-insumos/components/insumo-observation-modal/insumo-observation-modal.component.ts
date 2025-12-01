import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-insumo-observation-modal',
    templateUrl: './insumo-observation-modal.component.html'
})
export class InsumoObservationModalComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string; observation: string }
    ) {}
}