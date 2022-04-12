import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permiso } from "app/shared/models/permiso.model";
import { PermisosService } from "app/shared/services/permisos.service";
import { UserService } from "app/shared/services/user.service";

@Component({
    selector: 'abm-usuarios-dialog',
    templateUrl: 'abm-usuarios-dialog.component.html',
  })
  export class ABMUsuariosDialog implements OnInit{

    showSuccess: boolean = false;
    showError: boolean = false;
    
    selected: Array<number> = [];
    selectedToRemove: Array<number> = [];

    formDisabled: boolean = false;

    permisos: Array<Permiso> = [];
    permisosDisponibles: Array<Permiso> = [];
    permisosIncluidos: Array<Permiso> = [];

    constructor(
      private permisosService: PermisosService,
      private usuarioService: UserService,
      public dialogRef: MatDialogRef<ABMUsuariosDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    ngOnInit(): void {
      this.inicializar()
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

    onAddChange(event) {
      this.selected = event.value
    }

    onRemoveChange(event) {
      this.selectedToRemove = event.value
    }

    inicializar() {
      this.permisosIncluidos = this.data.row.profiles[0].permissions;
      this.permisosService.getPermisos().subscribe(d => {
        this.permisos = d.data;
        this.permisos.forEach(permiso => {
          let busqueda = this.permisosIncluidos.find(permisoI => permisoI.id == permiso.id);
          if(busqueda == undefined) {
            this.permisosDisponibles.push(permiso);
          }
        })
      })
    }

    add() {
      let index: Array<number> = [];
      this.permisosDisponibles.forEach(permiso => {
        let busqueda = this.selected.find(id => id == permiso.id);
        if(busqueda != undefined) {
          this.permisosIncluidos.push(permiso);
          index.push(this.permisosDisponibles.indexOf(permiso));
        }
      })
      let counter = 0;
      index.forEach(i => {
        if (index.length > 0) {
          this.permisosDisponibles.splice((i - counter), 1);
          counter++;
        }
      })
      this.selected = []
    }

    remove() {
      let index: Array<number> = [];
      this.permisosIncluidos.forEach(permiso => {
        let busqueda = this.selectedToRemove.find(id => id == permiso.id);
        if(busqueda != undefined) {
          this.permisosDisponibles.push(permiso);
          index.push(this.permisosIncluidos.indexOf(permiso));
        }
      })
      let counter = 0;
      index.forEach(i => {
        if (index.length > 0) {
          this.permisosIncluidos.splice((i - counter), 1);
          counter++;
        }
      })
      this.selectedToRemove = [];
    }
  }