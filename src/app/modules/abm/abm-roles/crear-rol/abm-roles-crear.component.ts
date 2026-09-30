import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { RemoveDialogComponent } from "app/shared/components/remove/remove.component";
import { Rol } from "app/modules/abm/abm-roles/rol.model";
import { RolesService } from "app/modules/abm/abm-roles/roles.service";
import { Subscription } from "rxjs";
import { ABMRolService } from "../abm-roles.service";
import { NotificationService } from "app/shared/services/notification.service";


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
        private notificationService: NotificationService
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
        let busquedaNombre = this.roles?.find(rol => rol.name.trim().toLowerCase() === model.name.trim().toLowerCase());
        let busquedaCodigo = this.roles?.find(rol => rol.code.trim().toUpperCase() === model.code.trim().toUpperCase());
        if(busquedaNombre != undefined) {
            this.showErrorName = true;
            this.notificationService.showError("El nombre de rol ingresado ya existe");
        }
        if(busquedaCodigo != undefined) {
            this.showErrorCode = true;
            this.notificationService.showError("El código ingresado ya existe");
        }
        if(this.showErrorName || this.showErrorCode || this.rolForm.invalid) {
            return;
        }
        this.rolForm.disable();
        this.rolesService.postRol(model).subscribe(res => {
            if (res.status == 'OK' || (res as any).ok) {
                this.showSuccess = true;
                this.notificationService.showSuccess("Cambios realizados");
                this.router.navigate(['/roles/grid']);
            } else {
                this.showError = true;
                this.notificationService.showError("No se pudieron realizar los cambios");
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
}