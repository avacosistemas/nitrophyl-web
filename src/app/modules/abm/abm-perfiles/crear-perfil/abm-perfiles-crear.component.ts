import { SelectionModel } from "@angular/cdk/collections";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Perfil } from "app/shared/models/perfil.model";
import { Permiso } from "app/shared/models/permiso.model";
import { Rol } from "app/shared/models/rol.model";
import { PerfilesService } from "app/shared/services/perfiles.service";
import { PermisosService } from "app/shared/services/permisos.service";
import { RolesService } from "app/shared/services/roles.service";
import { Subscription } from "rxjs";
import { ABMPerfilService } from "../abm-perfiles.service";

@Component({
    selector: 'abm-perfiles-crear',
    templateUrl: 'abm-perfiles-crear.component.html',
    styleUrls: ['./abm-perfiles-crear.component.scss']
  })

export class ABMCrearPerfil implements OnInit, OnDestroy{


  component = "Create";
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
    cambioPermisos: boolean = false;
    suscripcion: Subscription;


    constructor(
      public dialog: MatDialog,
      private router: Router,
      private permisosService: PermisosService,
      private perfilesService: PerfilesService,
      private rolesService: RolesService,
      private _formBuilder: FormBuilder,
      private ABMPerfilesService: ABMPerfilService
    ) {
      this.suscripcion = this.ABMPerfilesService.events.subscribe(
        (data: any) => {
          if(data == 1) {
            this.close();
          } else if (data == 4) {
            this.create();
          }
        }
      )
    }

    ngOnInit(): void {
      this.inicializar();
    }

    ngOnDestroy(): void {
      this.suscripcion.unsubscribe();
    }

    inicializar() {
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

    close() {
      if(this.createPerfilForm.pristine && this.cambioPermisos == false) {
        this.router.navigate(['/perfiles/grid'])
      } else {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
          maxWidth: '50%',
          data: {data: null, seccion: "perfil", boton: "Cerrar"},
        });
        dialogRef.afterClosed().subscribe(result => {
          if(result) {
            this.router.navigate(['/perfiles/grid']);
          }
        });
    }
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
            this.router.navigate(['/perfiles/grid']);
          } else {
            this.showError = true;
          }
          this.createPerfilForm.enable();
          this.formDisabled = false;
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
      this.cambioPermisos = true;
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
      this.cambioPermisos = true;
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