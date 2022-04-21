import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Perfil } from "app/shared/models/perfil.model";
import { User } from "app/shared/models/user.model";
import { PerfilesService } from "app/shared/services/perfiles.service";
import { UserService } from "app/shared/services/user.service";
import { Subscription } from "rxjs";
import { ABMService } from "../abm-usuarios.service";


@Component({
    selector: 'abm-usuarios-crear',
    templateUrl: './abm-usuarios-crear.component.html',
    styleUrls: ['./abm-usuarios-crear.component.scss']
})

export class ABMUsuariosCrearComponent implements OnInit, OnDestroy{

    component = "Create";
    mode: string;
    showSuccess: boolean = false;
    showError: boolean = false;
    data: User;
    selected: Array<number> = [];
    selectedToRemove: Array<number> = [];
    formDisabled: boolean = false;
    displayedColumns: string[] = ['select', 'name']
    controlGroup = new FormGroup({
      username: new FormControl(),
      name: new FormControl(),
      surname: new FormControl(),
      enabled: new FormControl(),
      email: new FormControl()
    });
    perfilesDisponibles: Array<Perfil> = [];
    perfilesIncluidos: Array<Perfil> = [];
    searchPerfiles: Array<Perfil> = [];
    searchPerfilesIncluidos: Array<Perfil> = [];
    selection = new SelectionModel<Perfil>(true, []);
    selectionIncluidos = new SelectionModel<Perfil>(true, []);
    inputDisponibles: string = "";
    inputIncluidos: string = "";
    suscripcion: Subscription;
    cambioPerfil: boolean = false;

    constructor(
        public dialog: MatDialog,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private usuarioService: UserService,
        private perfilesService: PerfilesService,
        private abmService: ABMService
    ){
        this.suscripcion = this.abmService.events.subscribe(
            (data: any) => {
              if(data == 1) {
                this.close();
              } else if(data == 4) {
                this.save();
              }
            }
          )
    }

    ngOnInit(): void {
        this.inicializar()
    }

    ngOnDestroy(): void {
      this.suscripcion.unsubscribe()
    }

    save() {
        let model: User = {
            email: this.controlGroup.controls.email.value,
            enabled: this.controlGroup.controls.enabled.value,
            id: 0,
            lastname: this.controlGroup.controls.surname.value,
            name: this.controlGroup.controls.name.value,
            profiles: this.perfilesIncluidos,
            username: this.controlGroup.controls.username.value
        }
        model.profiles = this.perfilesIncluidos;
        this.usuarioService.postUser(model).subscribe(response => {
          if (response.status == 'OK') {
            this.showSuccess = true;
            this.router.navigate(['/usuarios/grid']);
          } else {
            this.showError = true;
          }
        })
    }

    close() {
        if(this.controlGroup.pristine && this.cambioPerfil == false) {
          this.router.navigate(['/usuarios/grid'])
        } else {
          const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '50%',
            data: {data: null, seccion: "cambios", boton: "Cerrar"},
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result) {
              this.router.navigate(['/usuarios/grid']);
            }
          });
      }
    }
  
    onAddChange(event) {
        this.selected = event.value
    }
  
    onRemoveChange(event) {
        this.selectedToRemove = event.value
    }
  
    inicializar() {
        this.mode = this.usuarioService.getMode();
        if(this.mode == undefined || this.mode == "View") {
          this.mode = "View";
          this.controlGroup.disable();
        }
        this.perfilesService.getPerfiles().subscribe(d => {
            this.perfilesIncluidos = [];
            this.searchPerfilesIncluidos = [];
            this.perfilesDisponibles = d.data;
            this.searchPerfiles = this.perfilesDisponibles
        })
    }
  
    add() {
        this.cambioPerfil = true;
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
        this.cambioPerfil = true;
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