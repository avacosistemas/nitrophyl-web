import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { RemoveDialogComponent } from "app/shared/components/remove/remove.component";
import { Permiso } from "app/modules/abm/abm-permisos/permiso.model";
import { PermisosService } from "app/modules/abm/abm-permisos/permisos.service";
import { Subscription } from "rxjs";
import { ABMPermisoService } from "../abm-permisos.service";
import { NotificationService } from "app/shared/services/notification.service";

@Component({
    selector: 'abm-permisos-crear',
    templateUrl: 'abm-permisos-crear.component.html'
})

export class ABMCrearPermiso implements OnInit, OnDestroy {

    component = "Create";
    suscripcion: Subscription;
    permisoForm: FormGroup;
    permisos: Array<Permiso>;


    constructor(
        public dialog: MatDialog,
        private router: Router,
        private permisosService: PermisosService,
        private _formBuilder: FormBuilder,
        private ABMPermisoService: ABMPermisoService,
        private notificationService: NotificationService
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

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
          top.scrollIntoView();
          top = null;
        }
    }

    create() {
        if (this.permisoForm.invalid) {
            return;
        }
        this.permisoForm.disable();
        let model: Permiso = {
            id: null,
            code: this.permisoForm.controls.code.value,
            description: this.permisoForm.controls.description.value,
            enabled: true
        }
        let busqueda = this.permisos?.find(permiso => permiso.code.trim().toUpperCase() === model.code.trim().toUpperCase());
        if(busqueda == undefined) {
            this.permisosService.postPermiso(model).subscribe(res => {
                if (res.status == 'OK' || res.ok) {
                    this.notificationService.showSuccess("Cambios realizados");
                    this.router.navigate(['/permisos/grid']);
                } else {
                    this.notificationService.showError("No se pudieron realizar los cambios");
                }
                this.permisoForm.enable();
            });
        } else {
            this.notificationService.showError("El código ingresado ya existe");
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