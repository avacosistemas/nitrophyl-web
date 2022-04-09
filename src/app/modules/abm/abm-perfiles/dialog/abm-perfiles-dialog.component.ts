import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PerfilesService } from "app/shared/services/perfiles.service";

@Component({
    selector: 'abm-perfiles-dialog',
    templateUrl: 'abm-perfiles-dialog.component.html',
  })
  export class ABMPerfilesDialog implements OnInit{

    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
      private perfilesService: PerfilesService,
      public dialogRef: MatDialogRef<ABMPerfilesDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    ngOnInit(): void {
      
    }

    edit() {
      this.perfilesService.updatePerfil(this.data.row, this.data.row.id).subscribe(res=>{
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }

    delete(){
      this.perfilesService.deletePerfil(this.data.row.id).subscribe(res=>{
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
      })
    }
  }