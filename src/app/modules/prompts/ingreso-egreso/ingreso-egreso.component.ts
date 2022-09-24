import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: 'ingreso-egreso-dialog',
    templateUrl: 'ingreso-egreso.component.html',
    styleUrls: ['./ingreso-egreso.component.scss']
})

export class IngresoEgresoDialogComponent implements OnInit{
    comments: string;

    constructor(
        public dialogRef: MatDialogRef<IngresoEgresoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
    ){}

    ngOnInit(): void {
        
    }

    save() {
        this.dialogRef.close(true)
    }

    close() {
        this.dialogRef.close(false)
    }
}