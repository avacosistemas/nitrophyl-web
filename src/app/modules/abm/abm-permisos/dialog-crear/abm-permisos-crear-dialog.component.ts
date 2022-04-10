import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permiso } from "app/shared/models/permiso.model";
import { Rol } from "app/shared/models/rol.model";
import { PermisosService } from "app/shared/services/permisos.service";
import { RolesService } from "app/shared/services/roles.service";

@Component({
    selector: 'abm-permisos-crear-dialog',
    templateUrl: 'abm-permisos-crear-dialog.component.html',
  })
  export class ABMCrearPermisoDialog implements OnInit{

    createRolForm: FormGroup;
    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
      private _formBuilder: FormBuilder,
      private permisosService: PermisosService,
      public dialogRef: MatDialogRef<ABMCrearPermisoDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}

    ngOnInit(): void {
      this.createRolForm = this._formBuilder.group({
        code: ['', [Validators.required, Validators.maxLength(50)]],
        description: ['', [Validators.required, Validators.maxLength(100)]]
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

      let model: Permiso = {
        id: 0,
        code: this.createRolForm.controls.code.value,
        description: this.createRolForm.controls.description.value,
        enabled: true
      }
      this.permisosService.postPermiso(model).subscribe(res => {
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