import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from "app/shared/services/user.service";

@Component({
    selector: 'abm-usuarios-dialog',
    templateUrl: 'abm-usuarios-dialog.component.html',
  })
  export class ABMUsuariosDialog {

    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
      private usuarioService: UserService,
      public dialogRef: MatDialogRef<ABMUsuariosDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    edit() {
      this.usuarioService.updateUser(this.data.row, this.data.row.id).subscribe(response => {
        if (response.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }

    delete(){
      this.usuarioService.deleteUser(this.data.row.id).subscribe(response => {
        if (response.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }
  }