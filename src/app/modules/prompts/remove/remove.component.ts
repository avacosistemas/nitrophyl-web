import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: 'remove-dialog',
    templateUrl: 'remove.component.html',
})

export class RemoveDialogComponent implements OnInit{




    constructor(
        public dialogRef: MatDialogRef<RemoveDialogComponent>,
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