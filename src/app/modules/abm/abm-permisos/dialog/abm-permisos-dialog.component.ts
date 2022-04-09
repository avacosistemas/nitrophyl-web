import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PermisosService } from "app/shared/services/permisos.service";

@Component({
    selector: 'abm-permisos-dialog',
    templateUrl: 'abm-permisos-dialog.component.html',
  })
  export class ABMPermisosDialog {

    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
      private permisosService: PermisosService,
      public dialogRef: MatDialogRef<ABMPermisosDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    edit() {
      this.permisosService.updatePermiso(this.data.row, this.data.row.id).subscribe(res => {
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }

    delete() {
      this.permisosService.deletePermiso(this.data.row.id).subscribe(res => {
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }
  }