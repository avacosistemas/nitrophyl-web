import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import {  Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Permiso } from "app/shared/models/permiso.model";
import { PermisosService } from "app/shared/services/permisos.service";
import { Subscription } from "rxjs";
import { ABMPermisoService } from "../abm-permisos.service";

@Component({
    selector: 'abm-permisos-crear',
    templateUrl: 'abm-permisos-crear.component.html'
})

export class ABMCrearPermiso implements OnInit, OnDestroy {

    component = "Create";

    showSuccess: boolean = false;
    showError: boolean = false;
    showCodeError: boolean = false;

    suscripcion: Subscription;

    permisoForm: FormGroup;
    permisos: Array<Permiso>;


    constructor(
        public dialog: MatDialog,
        private router: Router,
        private permisosService: PermisosService,
        private _formBuilder: FormBuilder,
        private ABMPermisoService: ABMPermisoService
    ) {
        this.permisoForm = this._formBuilder.group({
            code: ['', [Validators.required, Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(100)]]
        })
        this.suscripcion = this.ABMPermisoService.events.subscribe(
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
        this.permisosService.getPermisos().subscribe(d => this.permisos = d.data);
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    create() {
        this.showCodeError = false;
        this.showError = false;
        this.showSuccess = false;
        if (this.permisoForm.invalid) {
            return;
        }
        this.permisoForm.disable();
        let model: Permiso = {
            id: 0,
            code: this.permisoForm.controls.code.value,
            description: this.permisoForm.controls.description.value,
            enabled: true
        }
        let busqueda = this.permisos.find(permiso => permiso.code == model.code);
        if(busqueda == undefined) {
            this.permisosService.postPermiso(model).subscribe(res => {
                if (res.status == 'OK') {
                    this.showSuccess = true;
                    this.router.navigate(['/permisos/grid']);
                } else {
                    this.showError = true;
                }
                this.permisoForm.enable();
            });
        } else {
            this.showCodeError = true;
            this.permisoForm.enable();
        }
    }

    close() {
        if (this.permisoForm.pristine == true) {
            this.router.navigate(['/permisos/grid'])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: "permiso", boton: "Cerrar" },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate(['/permisos/grid']);
                }
            });
        }
    }
}