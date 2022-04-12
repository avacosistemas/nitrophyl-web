import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Rol } from "app/shared/models/rol.model";
import { RolesService } from "app/shared/services/roles.service";

@Component({
    selector: 'abm-roles-crear-dialog',
    templateUrl: 'abm-roles-crear-dialog.component.html',
  })
  export class ABMCrearRolDialog implements OnInit{

    createRolForm: FormGroup;
    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
      private _formBuilder: FormBuilder,
      private rolesService: RolesService,
      public dialogRef: MatDialogRef<ABMCrearRolDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}

    ngOnInit(): void {
      this.createRolForm = this._formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(50)]],
        code: ['', [Validators.required, Validators.maxLength(10)]]
      });
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    cancel() {
      this.dialogRef.close();
    }

    create() {
      if (this.createRolForm.invalid) {
        return;
      }

      this.createRolForm.disable();

      let model: Rol = {
        id: 0,
        name: this.createRolForm.controls.name.value,
        code: this.createRolForm.controls.code.value
      }
      this.rolesService.postRol(model).subscribe(res => {
        if (res.status == 'OK') {
          this.showSuccess = true;
        } else {
          this.showError = true;
        }
        this.createRolForm.enable();
        this.createRolForm.reset();
      })
    }
  }