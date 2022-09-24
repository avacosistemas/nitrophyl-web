import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Rol } from "app/shared/models/rol.model";
import { RolesService } from "app/shared/services/roles.service";
import { Subscription } from "rxjs";
import { ABMRolService } from "../abm-roles.service";


@Component({
    selector: 'abm-roles-crear',
    templateUrl: './abm-roles-crear.component.html'
})

export class ABMCrearRol implements OnInit, OnDestroy{

    component: string = "Create";
    showSuccess: boolean = false;
    showError: boolean = false;
    showErrorCode: boolean = false;
    showErrorName: boolean = false;
    suscripcion: Subscription;
    rolForm: FormGroup;
    roles: Array<Rol>;

    constructor(
        public dialog: MatDialog,
        private router: Router,
        private rolesService: RolesService,
        private _formBuilder: FormBuilder,
        private ABMRolService: ABMRolService,
        private snackBar: MatSnackBar
    ){
        this.rolForm = this._formBuilder.group({
            code: ['', [Validators.required, Validators.maxLength(10)]],
            name: ['', [Validators.required, Validators.maxLength(50)]]
        });
        this.suscripcion = this.ABMRolService.events.subscribe(
            (data: any) => {
                if (data == 1) {
                    this.close();
                } else if (data == 4) {
                    this.create();
                }
            }
        )
    }

    ngOnInit(): void {
        this.rolesService.getRoles().subscribe(d => this.roles = d.data);
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

    create() {
        this.showError = false;
        this.showErrorCode = false;
        this.showSuccess = false;
        this.showErrorName = false;
        let model: Rol = {
            id: 0,
            code: this.rolForm.controls.code.value,
            name: this.rolForm.controls.name.value
        }
        let busquedaNombre = this.roles.find(rol => rol.name == model.name);
        let busquedaCodigo = this.roles.find(rol => rol.code == model.code);
        if(busquedaNombre != undefined) {
            this.showErrorName = true;
            this.openSnackBar("El nombre de rol ingresado ya existe", "X", "red-snackbar");
        }
        if(busquedaCodigo != undefined) {
            this.showErrorCode = true;
            this.openSnackBar("El código ingresado ya existe", "X", "red-snackbar");
        }
        if(this.showErrorName || this.showErrorCode || this.rolForm.invalid) {
            return;
        }
        this.rolForm.disable();
        this.rolesService.postRol(model).subscribe(res => {
            if (res.status == 'OK') {
                this.showSuccess = true;
                this.openSnackBar("Cambios realizados", "X", "green-snackbar");
                this.router.navigate(['/roles/grid']);
            } else {
                this.showError = true;
                this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
            }
            this.rolForm.enable();
        })
    }

    close() {
        if (this.rolForm.pristine == true) {
            this.router.navigate(['/roles/grid'])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: "rol", boton: "Cerrar" },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate(['/roles/grid']);
                }
            });
        }
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };

}