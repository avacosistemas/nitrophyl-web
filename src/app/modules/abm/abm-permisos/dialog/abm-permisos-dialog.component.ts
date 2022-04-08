import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'abm-permisos-dialog',
    templateUrl: 'abm-permisos-dialog.component.html',
  })
  export class ABMPermisosDialog {
    constructor(
      public dialogRef: MatDialogRef<ABMPermisosDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  }