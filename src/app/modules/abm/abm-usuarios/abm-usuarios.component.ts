import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from 'app/shared/models/user.model';
import { UserService } from 'app/shared/services/user.service';
import { ABMUsuariosDialog } from './dialog/abm-usuarios-dialog.component';

@Component({
    selector     : 'abm-usuarios',
    templateUrl  : './abm-usuarios.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMUsuariosComponent implements OnInit
{
    usuarios:  Array<any> = [];
    displayedColumns: string[] = ['usuario', 'nombre', 'apellido', 'email', 'perfil']

    constructor(
        private userService: UserService,
        public dialog: MatDialog) { }

    ngOnInit(): void {
        this.userService.getUsers().subscribe(d=>{
            this.usuarios = d.data;
        })
    }

    openModal(row) {
        const dialogRef = this.dialog.open(ABMUsuariosDialog, {
            width: '90%',
            maxHeight: '100%',
            data: {row: row},
        });
        dialogRef.afterClosed().subscribe(result => {
          });
    }
}
