import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/shared/components/remove/remove.component";
import { Perfil } from "app/modules/abm/abm-perfiles/perfil.model";
import { User } from "app/shared/models/user.model";
import { PerfilesService } from "app/modules/abm/abm-perfiles/perfiles.service";
import { UserService } from "app/shared/services/user.service";
import { Subscription } from "rxjs";
import { ABMUsuarioService } from "../abm-usuarios.service";
import { NotificationService } from "app/shared/services/notification.service";

@Component({
    selector: 'abm-usuarios-user',
    templateUrl: './abm-usuarios-user.component.html',
    styleUrls: ['./abm-usuarios-user.component.scss']
})

export class ABMUsuariosUserComponent implements OnInit, OnDestroy{

  component = "User";

    mode?: string;
    data?: User;
    selected: Array<number> = [];
    selectedToRemove: Array<number> = [];
    formDisabled: boolean = false;
    displayedColumns: string[] = ['select', 'name'];

    controlGroup = new FormGroup({
      username: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      surname: new FormControl('', [Validators.required]),
      enabled: new FormControl(true),
      mail: new FormControl('', [Validators.required, Validators.email]),
      admin: new FormControl(false)
    })
    
    
    perfiles: Array<Perfil> = [];
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
        private ABMUsuarioService: ABMUsuarioService,
        private notificationService: NotificationService
    ) {
      this.suscripcion = this.ABMUsuarioService.events.subscribe(
        (data: any) => {
          if(data == 1) {
            this.close();
          } else if(data == 2) {
            this.edit(false);
          } else if(data == 3) {
            this.editContinue();
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

    ngAfterViewInit() {
      let top = document.getElementById('top');
      if (top !== null) {
        top.scrollIntoView();
        top = null;
      }
  }
  
    edit(continuar: boolean = false) {
        if (!this.data) {
            return;
        }
        let model: User = {
            id: this.data.id,
            username: this.controlGroup.controls.username.value,
            name: this.controlGroup.controls.name.value,
            lastname: this.controlGroup.controls.surname.value,
            email: this.controlGroup.controls.mail.value,
            enabled: this.controlGroup.controls.enabled.value ?? true,
            admin: this.controlGroup.controls.admin?.value ?? false,
            profiles: this.perfilesIncluidos.map(p => ({ id: p.id }))
        };
        this.usuarioService.updateUser(model).subscribe(response => {
          if (response.status == 'OK' || (response as any).ok) {
            this.notificationService.showSuccess("Cambios realizados");
            if (!continuar) {
                this.router.navigate(['/usuarios/grid']);
            }
          } else {
            this.notificationService.showError("No se pudieron realizar los cambios");
          }
        })
    }

    editContinue() {
      this.edit(true);
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
        this.usuarioService.getUserById(this.activatedRoute.snapshot.params['id']).subscribe(d => {
            this.data = d.data;
            this.controlGroup.patchValue({
              username: this.data.username,
              name: this.data.name,
              surname: this.data.lastname,
              mail: this.data.email,
              enabled: this.data.enabled,
              admin: this.data.admin || false
            });
            this.perfilesService.getPerfiles().subscribe(res => {
                this.perfiles = res.data || [];
                const userProfileIds = (this.data.profiles || []).map(p => p.id);
                this.perfilesIncluidos = this.perfiles.filter(p => userProfileIds.includes(p.id));
                this.perfilesDisponibles = this.perfiles.filter(p => !userProfileIds.includes(p.id));
                this.searchPerfiles = [...this.perfilesDisponibles];
                this.searchPerfilesIncluidos = [...this.perfilesIncluidos];
            });
        });
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