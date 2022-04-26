import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Rol } from "app/shared/models/rol.model";
import { RolesService } from "app/shared/services/roles.service";
import { Subscription } from "rxjs";
import { ABMRolService } from "../abm-roles.service";


@Component({
    selector: 'abm-roles-rol',
    templateUrl: './abm-roles-rol.component.html'
})

export class ABMRolesRol implements OnInit, OnDestroy{

    component: string = "Rol";
    mode: string;
    showSuccess: boolean = false;
    showError: boolean = false;
    showErrorCode: boolean = false;
    showErrorName: boolean = false;
    suscripcion: Subscription;
    rolForm: FormGroup;
    roles: Array<Rol>;
    rol: Rol;

    constructor(
        private activatedRoute: ActivatedRoute,
        public dialog: MatDialog,
        private router: Router,
        private rolesService: RolesService,
        private _formBuilder: FormBuilder,
        private ABMRolService: ABMRolService
    ){
        this.rolForm = this._formBuilder.group({
            code: ['', [Validators.required, Validators.maxLength(10)]],
            name: ['', [Validators.required, Validators.maxLength(50)]]
        });
        this.suscripcion = this.ABMRolService.events.subscribe(
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

    inicializar() {
        this.mode = this.rolesService.getMode();
        if(this.mode == undefined || this.mode == "View") {
            this.mode = "View";
            this.rolForm.disable();
        }
        this.rolForm.controls.code.disable();
        this.rolesService.getRolById(this.activatedRoute.snapshot.params['id']).subscribe(d => {
            this.rol = d.data;
            this.rolForm.controls.code.setValue(d.data.code);
            this.rolForm.controls.name.setValue(d.data.name);
        });
        this.rolesService.getRoles().subscribe(d => this.roles = d.data);
    }

    editContinue() {
        this.edit(true);
    }

    edit(continuar: boolean) {
        this.showError = false;
        this.showErrorCode = false;
        this.showSuccess = false;
        this.showErrorName = false;
        if (this.rolForm.invalid) {
            return;
        }
        this.rolForm.disable();
        let model: Rol = this.rol;
        model.name = this.rolForm.controls.name.value;
        let busquedaNombre = this.roles.find(rol => rol.name == model.name);
        if(busquedaNombre != undefined) {
            this.showErrorName = true;
            this.rolForm.enable();
            this.rolForm.controls.code.disable();
            return;
        }
        this.rolesService.updateRol(model, model.id).subscribe(res => {
            if (res.status == 'OK') {
                this.showSuccess = true;
                if (!continuar) {
                    this.router.navigate(['/roles/grid']);
                }
            } else {
                this.showError = true;
            }
            this.rolForm.enable();
            this.rolForm.controls.code.disable();
        });
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