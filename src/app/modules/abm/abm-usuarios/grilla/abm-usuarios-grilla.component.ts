import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { User } from 'app/shared/models/user.model';
import { UserService } from 'app/shared/services/user.service';


interface Data {
    row: User
}
@Component({
    selector     : 'abm-usuarios-grilla',
    templateUrl  : './abm-usuarios-grilla.component.html',
    encapsulation: ViewEncapsulation.None
})



export class ABMUsuariosGrillaComponent implements OnInit
{
    component = "Grilla";
    usuarios:  Array<any> = [];
    displayedColumns: string[] = ['usuario', 'nombre', 'apellido', 'email', 'perfil', 'acciones']
    data: Data;
    showSuccess = false;
    showError = false;

    constructor(
        private usuarioService: UserService,
        public dialog: MatDialog) { }

    ngOnInit(): void {
        this.inicializar();
    }

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
          top.scrollIntoView();
          top = null;
        }
    }

    openUser(id: number) {
        if(id == 1) {
            //Editar
            this.usuarioService.setMode("Edit")
        } else {
            //Ver
            this.usuarioService.setMode("View")
        }
    }

    inicializar() {
        this.usuarioService.getUsers().subscribe(d=>{
            this.usuarios = d.data;
        })
    }

    delete(row) {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: {data: row.username, seccion: "usuario", boton: "Eliminar"},
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.usuarioService.deleteUser(row.id).subscribe(response => {
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
