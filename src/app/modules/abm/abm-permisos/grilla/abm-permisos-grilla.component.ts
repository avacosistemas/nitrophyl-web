import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { RemoveDialogComponent } from "app/shared/components/remove/remove.component";
import { Permiso } from "app/modules/abm/abm-permisos/permiso.model";
import { PermisosService } from "app/modules/abm/abm-permisos/permisos.service";
import { NotificationService } from "app/shared/services/notification.service";


@Component({
    selector     : 'abm-permisos-grilla',
    templateUrl  : './abm-permisos-grilla.component.html'
})

export class ABMPermisosGrillaComponent {

    component: string = "Grilla";
    permisos: Array<Permiso> = [];
    displayedColumns: string[] = ['code', 'description', 'enabled', 'acciones'];
    dataSource: any;
    showSuccess = false;
    showError = false;

    constructor(
        private permisosService: PermisosService,
        public dialog: MatDialog,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.inicializar()
    }

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
          top.scrollIntoView();
          top = null;
        }
    }

    openPermission(id: number) {
        if(id == 1) {
            //Editar
            this.permisosService.setMode("Edit")
        } else {
            //Ver
            this.permisosService.setMode("View")
        }
    }

    delete(row) {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: {data: row.code, seccion: "permiso", boton: "Eliminar"},
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.permisosService.deletePermiso(row.id).subscribe(response => {
                    if (response.status == 'OK' || (response as any).ok) {
                      this.showSuccess = true;
                    } else {
                      this.showError = true;
                    }
                    this.inicializar();
                })
            }
        });
    }

    inicializar() {
        this.permisosService.getPermisos().subscribe(d=>{
            this.permisos = d.data || [];
        })
    }

    toggleHabilitado(element: Permiso, event: MatSlideToggleChange) {
        const nuevoEstado = event.checked;
        const permisoActualizado: Permiso = {
            ...element,
            enabled: nuevoEstado
        };

        this.permisosService.updatePermiso(permisoActualizado).subscribe({
            next: (response) => {
                if (response.status === 'OK' || (response as any).ok) {
                    element.enabled = nuevoEstado;
                    this.notificationService.showSuccess(`Permiso ${element.code} ${nuevoEstado ? 'habilitado' : 'deshabilitado'} con éxito`);
                } else {
                    event.source.checked = !nuevoEstado;
                    element.enabled = !nuevoEstado;
                    this.notificationService.showError('No se pudo actualizar el estado del permiso');
                }
            },
            error: () => {
                event.source.checked = !nuevoEstado;
                element.enabled = !nuevoEstado;
                this.notificationService.showError('Error al comunicarse con el servidor');
            }
        });
    }
}