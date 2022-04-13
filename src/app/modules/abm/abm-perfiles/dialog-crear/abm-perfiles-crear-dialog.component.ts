import { SelectionModel } from "@angular/cdk/collections";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Perfil } from "app/shared/models/perfil.model";
import { Permiso } from "app/shared/models/permiso.model";
import { Rol } from "app/shared/models/rol.model";
import { PerfilesService } from "app/shared/services/perfiles.service";
import { PermisosService } from "app/shared/services/permisos.service";
import { RolesService } from "app/shared/services/roles.service";

@Component({
    selector: 'abm-perfiles-crear-dialog',
    templateUrl: 'abm-perfiles-crear-dialog.component.html',
  })

export class ABMCrearPerfilDialog implements OnInit{

    roles: Array<Rol> = [];
    displayedColumns: string[] = ['select', 'code', 'description']
    createPerfilForm: FormGroup;

    formDisabled: boolean = false;

    showSuccess: boolean = false;
    showError: boolean = false;

    selected: Array<number> = [];
    selectedToRemove: Array<number> = [];

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
      private perfilesService: PerfilesService,
      private rolesService: RolesService,
      private _formBuilder: FormBuilder,
      public dialogRef: MatDialogRef<ABMCrearPerfilDialog>,
      @Inject(MAT_DIALOG_DATA) public data,
    ) {}

    ngOnInit(): void {
      this.createPerfilForm = this._formBuilder.group({
        name: ['', [Validators.required]],
        role: ['', [Validators.required]]
      });
      this.permisosService.getPermisos().subscribe(data => {
        this.permisos = data.data;
        this.permisosDisponibles = data.data;
        this.searchPermisos = data.data;
      });
      this.rolesService.getRoles().subscribe(data => {
        this.roles = data.data;
      })
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    cancel() {
      this.dialogRef.close();
    }

    create() {
      if (this.createPerfilForm.invalid) {
        return;
      }

      this.createPerfilForm.disable();
      this.formDisabled = true;

      let busquedaRol = this.roles.find(rol => rol.id = this.createPerfilForm.controls.role.value);

      if(busquedaRol != undefined) {
        let model: Perfil = {
          enabled: true,
          id: 0,
          name: this.createPerfilForm.controls.name.value,
          permissions: this.permisosIncluidos,
          role: busquedaRol
        }
        this.perfilesService.postPerfil(model).subscribe(res => {
          if (res.status == 'OK') {
            this.showSuccess = true;
          } else {
            this.showError = true;
          }
          this.createPerfilForm.enable();
          this.formDisabled = true;
          this.createPerfilForm.reset();
        })
      }
    }

    onAddChange(event) {
      this.selected = event.value
    }

    onRemoveChange(event) {
      this.selectedToRemove = event.value
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