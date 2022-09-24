import { SelectionModel } from "@angular/cdk/collections";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
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
    selector: 'abm-perfiles-perfil',
    templateUrl: 'abm-perfiles-perfil.component.html',
    styleUrls: ['./abm-perfiles-perfil.component.scss']
})

export class ABMPerfilesPerfil implements OnInit, OnDestroy {

    component = "Perfil";
    mode: string;
    roles: Array<Rol> = [];
    displayedColumns: string[] = ['select', 'code', 'description']
    createPerfilForm: FormGroup;
    formDisabled: boolean = false;
    data: Perfil;
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
        private activatedRoute: ActivatedRoute,
        public dialog: MatDialog,
        private router: Router,
        private permisosService: PermisosService,
        private perfilesService: PerfilesService,
        private rolesService: RolesService,
        private _formBuilder: FormBuilder,
        private ABMPerfilesService: ABMPerfilService,
        private snackBar: MatSnackBar
    ) {
        this.createPerfilForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            role: ['', [Validators.required]]
        });
        this.suscripcion = this.ABMPerfilesService.events.subscribe(
            (data: any) => {
                if (data == 1) {
                    this.close();
                } else if (data == 2) {
                    this.edit(false);
                } else if (data == 3) {
                    this.editContinue();
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

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
          top.scrollIntoView();
          top = null;
        }
    }

    inicializar() {
        this.mode = this.perfilesService.getMode();
        if(this.mode == undefined || this.mode == "View") {
            this.mode = "View";
            this.createPerfilForm.disable();
        }
        
        this.perfilesService.getPerfilById(this.activatedRoute.snapshot.params['id']).subscribe(d => {
            this.createPerfilForm.controls.role.setValue(d.data.role.id);
            this.createPerfilForm.controls.name.setValue(d.data.name);
            this.data = d.data;
            this.permisosIncluidos = this.data.permissions;
            this.searchPermisosIncluidos = this.permisosIncluidos;
            this.permisosService.getPermisos().subscribe(d=>{
                this.permisos = d.data;
                this.permisos.forEach(perfil => {
                    let busqueda = this.permisosIncluidos.find(perfilI => perfilI.id == perfil.id);
                    if(busqueda == undefined) {
                        this.permisosDisponibles.push(perfil);
                    }
                });
                this.searchPermisos = this.permisosDisponibles;
            });
        });
        this.rolesService.getRoles().subscribe(data => {
            this.roles = data.data;
        })
    }

    edit(continuar: boolean) {
        if(this.createPerfilForm.invalid) {
            return;
        }
        this.createPerfilForm.disable();
        this.formDisabled = true;
        let model = this.data;
        model.name = this.createPerfilForm.controls.name.value;
        let busqueda = this.roles.find(rol => rol.id == this.createPerfilForm.controls.role.value);
        if(busqueda != undefined) {
            model.permissions = this.permisosIncluidos;
            model.role = busqueda;
            this.perfilesService.updatePerfil(model, model.id).subscribe(res => {
                if (res.status == 'OK') {
                    this.openSnackBar("Cambios realizados", "X", "green-snackbar");
                    if(!continuar) {
                        this.router.navigate(['/perfiles/grid']);
                    }
                } else {
                    this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
                }
                this.createPerfilForm.enable();
                this.formDisabled = false;
            })
        }
        
    }

    editContinue() {
        this.edit(true);
    }

    close() {
        if (this.createPerfilForm.pristine && this.cambioPermisos == false) {
            this.router.navigate(['/perfiles/grid'])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: "perfil", boton: "Cerrar" },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate(['/perfiles/grid']);
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

    add() {
        this.cambioPermisos = true;
        let index: Array<number> = [];
        this.permisosDisponibles.forEach(permiso => {
            let busqueda = this.selection.selected.find(seleccionado => seleccionado.id == permiso.id);
            if (busqueda != undefined) {
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
            if (busqueda != undefined) {
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

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}