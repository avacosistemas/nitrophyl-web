import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Rol } from "app/shared/models/rol.model";
import { RolesService } from "app/shared/services/roles.service";

@Component({
    selector: 'abm-roles-grilla',
    templateUrl: './abm-roles-grilla.component.html'
})

export class ABMRolesGrillaComponent {
    
    component: string = "Grilla";
    roles: Array<Rol>;
    displayedColumns: string[] = ['code', 'name', 'acciones'];
    showSuccess: boolean = false;
    showError: boolean = false;

    constructor(
        private rolesService: RolesService,
        public dialog: MatDialog) 
    { }

    ngOnInit(): void {
        this.inicializar()
    }

    inicializar() {
        this.rolesService.getRoles().subscribe(d => this.roles = d.data)
    }

    openRole(id: number) {
        if(id == 1) {
            //Editar
            this.rolesService.setMode("Edit")
        } else {
            //Ver
            this.rolesService.setMode("View")
        }
    }

    delete(row) {
        console.log(row)
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: {data: row.name, seccion: "rol", boton: "Eliminar"},
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.rolesService.deleteRol(row.id).subscribe(response => {
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
}