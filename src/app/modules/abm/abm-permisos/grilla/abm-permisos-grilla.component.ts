import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Permiso } from "app/shared/models/permiso.model";
import { PermisosService } from "app/shared/services/permisos.service";


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
        public dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.inicializar()
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
                    if (response.status == 'OK') {
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
            this.permisos = d.data;
        })
    }
}