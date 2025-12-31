import { Component } from '@angular/core';

@Component({
    selector: 'app-delete-formula-confirmation',
    template: `
        <div class="flex items-center mt-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <mat-checkbox [(ngModel)]="isChecked" color="warn">
                <span class="text-sm font-medium text-gray-700">
                    He leído la advertencia y deseo continuar con el borrado.
                </span>
            </mat-checkbox>
        </div>
    `
})
export class DeleteFormulaConfirmationComponent {
    isChecked: boolean = false;

    getValue() {
        return this.isChecked ? true : null;
    }
}