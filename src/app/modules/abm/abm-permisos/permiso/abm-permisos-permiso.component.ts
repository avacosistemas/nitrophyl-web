import { SelectionModel } from "@angular/cdk/collections";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Perfil } from "app/shared/models/perfil.model";
import { Permiso } from "app/shared/models/permiso.model";
import { Rol } from "app/shared/models/rol.model";
import { PerfilesService } from "app/shared/services/perfiles.service";
import { PermisosService } from "app/shared/services/permisos.service";
import { RolesService } from "app/shared/services/roles.service";
import { Subscription } from "rxjs";
import { ABMPermisoService } from "../abm-permisos.service";

@Component({
    selector: 'abm-permisos-permiso',
    templateUrl: 'abm-permisos-permiso.component.html'
})

export class ABMPermisosPermiso implements OnInit, OnDestroy {

    component = "Permiso";
    mode: string;

    showSuccess: boolean = false;
    showError: boolean = false;

    suscripcion: Subscription;

    permisoForm: FormGroup;
    permiso: Permiso;


    constructor(
        private activatedRoute: ActivatedRoute,
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
        this.mode = this.permisosService.getMode();
        if(this.mode == undefined || this.mode == "View") {
            this.mode = "View";
            this.permisoForm.disable();
        }
        this.permisoForm.controls.code.disable();
        this.permisosService.getPermisoById(this.activatedRoute.snapshot.params['id']).subscribe(d => {
            this.permiso = d.data;
            this.permisoForm.controls.code.setValue(d.data.code);
            this.permisoForm.controls.description.setValue(d.data.description);
        })
    }

    editContinue() {
        this.edit(true);
    }

    edit(continuar: boolean) {
        if (this.permisoForm.invalid) {
            return;
        }
        this.permisoForm.disable();
        let model = this.permiso;
        model.description = this.permisoForm.controls.description.value;
        this.permisosService.updatePermiso(model, model.id).subscribe(res => {
            if (res.status == 'OK') {
                this.showSuccess = true;
                if (!continuar) {
                    this.router.navigate(['/permisos/grid']);
                }
            } else {
                this.showError = true;
            }
            this.permisoForm.enable();
            this.permisoForm.controls.code.disable();
        });
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