import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'app-revision-inicial-input',
    template: `
        <mat-form-field appearance="outline" class="w-full mat-form-without-wrapper">
        <mat-label>Número de Revisión Inicial</mat-label>
        <input matInput type="number" [(ngModel)]="localInitialRevision" (ngModelChange)="onModelChange($event)">
        </mat-form-field>
    `
})
export class RevisionInicialInputComponent implements OnInit {
    @Input() initialRevision: number = 0;

    localInitialRevision: number | null = null;

    @Output() valueChange = new EventEmitter<number>();

    ngOnInit(): void {
        this.localInitialRevision = Number(this.initialRevision || 0);
    }

    onModelChange(value: any): void {
        const parsedValue = Number(value);
        if (!isNaN(parsedValue)) {
            this.localInitialRevision = parsedValue;
        } else {
            this.localInitialRevision = null;
        }
        this.valueChange.emit(this.localInitialRevision);
    }

    public getValue(): { initialRevision: number | null } {
        const revisionToReturn = Number(this.localInitialRevision);
        return { initialRevision: !isNaN(revisionToReturn) ? revisionToReturn : null };
    }
}