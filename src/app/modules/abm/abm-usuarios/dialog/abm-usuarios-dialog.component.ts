import { SelectionModel } from "@angular/cdk/collections";
import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Perfil } from "app/shared/models/perfil.model";
import { PerfilesService } from "app/shared/services/perfiles.service";
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

    displayedColumns: string[] = ['select', 'name']
    
    perfiles: Array<Perfil> = [];
    perfilesDisponibles: Array<Perfil> = [];
    perfilesIncluidos: Array<Perfil> = [];
    searchPerfiles: Array<Perfil> = [];
    searchPerfilesIncluidos: Array<Perfil> = [];
    selection = new SelectionModel<Perfil>(true, []);
    selectionIncluidos = new SelectionModel<Perfil>(true, []);
    inputDisponibles: string = "";
    inputIncluidos: string = "";

    constructor(
      private perfilesService: PerfilesService,
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
      model.profiles = this.perfilesIncluidos;
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
      this.perfilesIncluidos = this.data.row.profiles;
      this.searchPerfilesIncluidos = this.perfilesIncluidos;
      this.perfilesService.getPerfiles().subscribe(d=>{
        this.perfiles = d.data;
        this.perfiles.forEach(perfil => {
          let busqueda = this.perfilesIncluidos.find(perfilI => perfilI.id == perfil.id);
          if(busqueda == undefined) {
            this.perfilesDisponibles.push(perfil);
          }
        });
        this.searchPerfiles = this.perfilesDisponibles;
      })
    }

    add() {
      let index: Array<number> = [];
      this.perfilesDisponibles.forEach(perfil => {
        let busqueda = this.selection.selected.find(seleccionado => seleccionado.id == perfil.id);
        if(busqueda != undefined) {
          this.perfilesIncluidos.push(perfil);
          index.push(this.perfilesDisponibles.indexOf(perfil));
        }
      })
      let counter = 0;
      index.forEach(i => {
        if (index.length > 0) {
          this.perfilesDisponibles.splice((i - counter), 1);
          counter++;
        }
      })
      this.searchPerfiles = this.perfilesDisponibles;
      this.searchPerfiles = [...this.searchPerfiles];
      this.searchPerfilesIncluidos = this.perfilesIncluidos;
      this.searchPerfilesIncluidos = [...this.searchPerfilesIncluidos];
      this.inputDisponibles = "";
      this.selection.clear();
    }

    remove() {
      let index: Array<number> = [];
      this.perfilesIncluidos.forEach(perfil => {
        let busqueda = this.selectionIncluidos.selected.find(seleccionado => seleccionado.id == perfil.id);
        if(busqueda != undefined) {
          this.perfilesDisponibles.push(perfil);
          index.push(this.perfilesIncluidos.indexOf(perfil));
        }
      })
      let counter = 0;
      index.forEach(i => {
        if (index.length > 0) {
          this.perfilesIncluidos.splice((i - counter), 1);
          counter++;
        }
      })
      this.searchPerfiles = this.perfilesDisponibles;
      this.searchPerfiles = [...this.searchPerfiles];
      this.searchPerfilesIncluidos = this.perfilesIncluidos;
      this.searchPerfilesIncluidos = [...this.searchPerfilesIncluidos];
      this.inputIncluidos = "";
      this.selectionIncluidos.clear();
    }

    onKeyDisponibles(value) {
      this.searchPerfiles = this.search(value);
    }

    onKeyIncluidos(value) {
      this.searchPerfilesIncluidos = this.searchIncluidos(value)
    }

    search(value: string) { 
      let filter = value.toLowerCase();
      return this.perfilesDisponibles.filter(option => option.name.toLowerCase().startsWith(filter));
    }

    searchIncluidos(value: string) {
      let filter = value.toLowerCase();
      return this.perfilesIncluidos.filter(option => option.name.toLowerCase().startsWith(filter));
    }

    isAllSelected(id: number) {
      if (id == 1) {
        const numSelected = this.selection.selected.length;
        const numRows = this.searchPerfiles.length;
        return numSelected === numRows;
      } else {
        const numSelected = this.selectionIncluidos.selected.length;
        const numRows = this.searchPerfilesIncluidos.length;
        return numSelected === numRows;
      }
      
    }

    masterToggle(id: number) {
      if (id == 1) {
        this.isAllSelected(1) ?
        this.selection.clear() :
        this.searchPerfiles.forEach(row => this.selection.select(row));
      } else {
        this.isAllSelected(2) ?
        this.selectionIncluidos.clear() :
        this.searchPerfilesIncluidos.forEach(row => this.selectionIncluidos.select(row));
      }
      
    }
  }