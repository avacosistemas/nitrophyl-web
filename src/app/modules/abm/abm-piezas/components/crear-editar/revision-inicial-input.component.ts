import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-revision-inicial-input',
    template: `
    <mat-form-field appearance="outline" class="w-full mat-form-without-wrapper">
      <mat-label>Número de Revisión Inicial</mat-label>
      <input matInput type="number" [(ngModel)]="initialRevision" (ngModelChange)="revisionChange.emit(initialRevision)">
    </mat-form-field>
  `
})
export class RevisionInicialInputComponent {
    initialRevision: number = 0;
    @Output() revisionChange = new EventEmitter<number>();
}