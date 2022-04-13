import { SelectionModel } from "@angular/cdk/collections";
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

    displayedColumns: string[] = ['select', 'code', 'description']

    permisos: Array<Permiso> = [];
    permisosDisponibles: Array<Permiso> = [];
    permisosIncluidos: Array<Permiso> = [];
    searchPermisos: Array<Permiso> = [];
    searchPermisosIncluidos: Array<Permiso> = [];
    selection = new SelectionModel<Permiso>(true, []);
    selectionIncluidos = new SelectionModel<Permiso>(true, []);
    inputDisponibles: string = "";
    inputIncluidos: string = "";

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
      let model = this.data.row;
      model.profiles[0].permissions = this.permisosIncluidos;
      this.usuarioService.updateUser(model, this.data.row.id).subscribe(response => {
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
      this.searchPermisosIncluidos = this.permisosIncluidos;
      this.permisosService.getPermisos().subscribe(d => {
        this.permisos = d.data;
        this.permisos.forEach(permiso => {
          let busqueda = this.permisosIncluidos.find(permisoI => permisoI.id == permiso.id);
          if(busqueda == undefined) {
            this.permisosDisponibles.push(permiso);
          }
        });
        this.searchPermisos = this.permisosDisponibles;
      })
    }

    add() {
      let index: Array<number> = [];
      this.permisosDisponibles.forEach(permiso => {
        let busqueda = this.selection.selected.find(seleccionado => seleccionado.id == permiso.id);
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
      this.searchPermisos = this.permisosDisponibles;
      this.searchPermisos = [...this.searchPermisos];
      this.searchPermisosIncluidos = this.permisosIncluidos;
      this.searchPermisosIncluidos = [...this.searchPermisosIncluidos];
      this.inputDisponibles = "";
      this.selection.clear();
    }

    remove() {
      let index: Array<number> = [];
      this.permisosIncluidos.forEach(permiso => {
        let busqueda = this.selectionIncluidos.selected.find(seleccionado => seleccionado.id == permiso.id);
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
      this.searchPermisos = this.permisosDisponibles;
      this.searchPermisos = [...this.searchPermisos];
      this.searchPermisosIncluidos = this.permisosIncluidos;
      this.searchPermisosIncluidos = [...this.searchPermisosIncluidos];
      this.inputIncluidos = "";
      this.selectionIncluidos.clear();
    }

    onKeyDisponibles(value) {
      this.searchPermisos = this.search(value);
    }

    onKeyIncluidos(value) {
      this.searchPermisosIncluidos = this.searchIncluidos(value)
    }

    search(value: string) { 
      let filter = value.toLowerCase();
      return this.permisosDisponibles.filter(option => option.code.toLowerCase().startsWith(filter));
    }

    searchIncluidos(value: string) {
      let filter = value.toLowerCase();
      return this.permisosIncluidos.filter(option => option.code.toLowerCase().startsWith(filter));
    }

    isAllSelected(id: number) {
      if (id == 1) {
        const numSelected = this.selection.selected.length;
        const numRows = this.searchPermisos.length;
        return numSelected === numRows;
      } else {
        const numSelected = this.selectionIncluidos.selected.length;
        const numRows = this.searchPermisosIncluidos.length;
        return numSelected === numRows;
      }
      
    }

    masterToggle(id: number) {
      if (id == 1) {
        this.isAllSelected(1) ?
        this.selection.clear() :
        this.searchPermisos.forEach(row => this.selection.select(row));
      } else {
        this.isAllSelected(2) ?
        this.selectionIncluidos.clear() :
        this.searchPermisosIncluidos.forEach(row => this.selectionIncluidos.select(row));
      }
      
    }
  }