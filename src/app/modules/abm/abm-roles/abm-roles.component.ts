import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Rol } from 'app/shared/models/rol.model';
import { PerfilesService } from 'app/shared/services/perfiles.service';
import { RolesService } from 'app/shared/services/roles.service';
import { forkJoin } from 'rxjs';
import { ABMRolesDialog } from './dialog/abm-roles-dialog.component';

@Component({
    selector     : 'abm-roles',
    templateUrl  : './abm-roles.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMRolesComponent implements OnInit
{

    permisos: Array<Rol> = [];
    permisosAMostrar = [];
    displayedColumns: string[] = ['id', 'code', 'name', 'codePermission']

    constructor(
        private rolesService: RolesService,
        private perfilesService: PerfilesService,
        public dialog: MatDialog) { }

    ngOnInit(): void {
        forkJoin([this.rolesService.getRoles(), this.perfilesService.getPerfiles()]).subscribe(results => {
            this.permisos = results[0].data;
            let idPermisos: Array<Number> = [];
            results[0].data.forEach(rol => {
                idPermisos.push(rol.id)
            })
            idPermisos.forEach((id, index) => {
                let busqueda = results[1].data.find(data => data.role.id == id);
                if(busqueda != undefined) {
                    this.permisosAMostrar[index] = {
                        id: results[0].data[index].id,
                        code: results[0].data[index].code,
                        name: results[0].data[index].name,
                        permissions: ""
                    }
                    let index2 = 0;
                    busqueda.permissions.forEach(permission => {
                        index2++;
                        if(index2 < busqueda.permissions.length) {
                            this.permisosAMostrar[index].permissions = this.permisosAMostrar[index].permissions + `${permission.id}, `
                        } else {
                            this.permisosAMostrar[index].permissions = this.permisosAMostrar[index].permissions + `${permission.id}`
                        }
                    })
                    this.permisosAMostrar = [...this.permisosAMostrar]
                } else {
                    this.permisosAMostrar[index] = {
                        id: results[0].data[index].id,
                        code: results[0].data[index].code,
                        name: results[0].data[index].name,
                        permissions: ""
                    }
                }
            })
        })
    }

    openModal(row) {
        console.log(row);
        const dialogRef = this.dialog.open(ABMRolesDialog, {
            width: '250px',
            data: {row: row},
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
          });
    }
}
