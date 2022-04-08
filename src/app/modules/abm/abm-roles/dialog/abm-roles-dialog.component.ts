import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'abm-roles-dialog',
    templateUrl: 'abm-roles-dialog.component.html',
  })
  export class ABMRolesDialog {
    constructor(
      public dialogRef: MatDialogRef<ABMRolesDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  }