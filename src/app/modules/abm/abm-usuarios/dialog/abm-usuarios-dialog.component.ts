import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'abm-usuarios-dialog',
    templateUrl: 'abm-usuarios-dialog.component.html',
  })
  export class ABMUsuariosDialog {
    constructor(
      public dialogRef: MatDialogRef<ABMUsuariosDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  }