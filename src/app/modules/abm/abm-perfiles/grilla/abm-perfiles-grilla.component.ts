import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PerfilesService } from 'app/shared/services/perfiles.service';
import { MatDialog } from '@angular/material/dialog';
import { Perfil } from 'app/shared/models/perfil.model';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

@Component({
    selector     : 'abm-perfiles-grilla',
    templateUrl  : './abm-perfiles-grilla.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMPerfilesGrillaComponent implements OnInit
{
    component = "Grilla";
    perfiles: Array<Perfil> = [];
    displayedColumns: string[] = ['name', 'enabled', 'roleCode', 'roleName', 'acciones'];
    showSuccess = false;
    showError = false;

    constructor(
        private perfilesService: PerfilesService,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.inicializar()
    }

    openProfile(id: number) {
        if(id == 1) {
            //Editar
            this.perfilesService.setMode("Edit")
        } else {
            //Ver
            this.perfilesService.setMode("View")
        }
    }

    inicializar() {
        this.perfilesService.getPerfiles().subscribe(d=>{
            this.perfiles = d.data;
        })
    }

    delete(row) {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: {data: row.name, seccion: "perfil", boton: "Eliminar"},
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.perfilesService.deletePerfil(row.id).subscribe(response => {
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
