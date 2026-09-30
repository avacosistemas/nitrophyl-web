import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RemoveDialogComponent } from 'app/shared/components/remove/remove.component';
import { User } from 'app/shared/models/user.model';
import { UserService } from 'app/shared/services/user.service';
import { PerfilesService } from 'app/modules/abm/abm-perfiles/perfiles.service';
import { Perfil } from 'app/modules/abm/abm-perfiles/perfil.model';

interface Data {
    row: User;
}

@Component({
    selector     : 'abm-usuarios-grilla',
    templateUrl  : './abm-usuarios-grilla.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMUsuariosGrillaComponent implements OnInit {
    component = "Grilla";
    usuarios: Array<User> = [];
    perfiles: Array<Perfil> = [];
    displayedColumns: string[] = ['usuario', 'nombre', 'apellido', 'email', 'perfil', 'acciones'];
    data: Data;
    showSuccess = false;
    showError = false;

    constructor(
        private usuarioService: UserService,
        private perfilesService: PerfilesService,
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
        this.perfilesService.getPerfiles().subscribe(d => {
            this.perfiles = d.data || [];
        });
        this.usuarioService.getUsers().subscribe(d=>{
            this.usuarios = d.data || [];
        });
    }

    getProfileName(row: User): string {
        if (!row.profiles || row.profiles.length === 0) {
            return '-';
        }
        return row.profiles.map(p => {
            if (p.name) {
                return p.name;
            }
            const match = this.perfiles.find(item => item.id === p.id);
            return match ? match.name : `#${p.id}`;
        }).join(', ');
    }

    delete(row) {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: {data: row.username, seccion: "usuario", boton: "Eliminar"},
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.usuarioService.deleteUser(row.id).subscribe(response => {
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
}
