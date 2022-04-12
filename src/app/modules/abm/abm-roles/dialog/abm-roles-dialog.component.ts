import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Rol } from "app/shared/models/rol.model";
import { RolesService } from "app/shared/services/roles.service";

@Component({
    selector: 'abm-roles-dialog',
    templateUrl: 'abm-roles-dialog.component.html',
  })
  export class ABMRolesDialog {

    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
      private rolesService: RolesService,
      public dialogRef: MatDialogRef<ABMRolesDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    edit() {
      let model: Rol = {
        id: this.data.row.id,
        code: this.data.row.code,
        name: this.data.row.name
      }
      this.rolesService.updateRol(model, model.id).subscribe(res => {
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }

    delete() {
      this.rolesService.deleteRol(this.data.row.id).subscribe(res => {
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }
  }