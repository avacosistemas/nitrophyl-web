import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PerfilesService } from 'app/shared/services/perfiles.service';
import { ABMPerfilesDialog } from './dialog/abm-perfiles-dialog.component';
import { ABMCrearPerfilDialog } from './dialog-crear/abm-perfiles-crear-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector     : 'abm-perfiles',
    templateUrl  : './abm-perfiles.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMPerfilesComponent implements OnInit
{
    
    perfiles: Array<any> = [];
    displayedColumns: string[] = ['id', 'name', 'enabled', 'roleCode', 'roleName']

    constructor(
        private perfilesService: PerfilesService,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.inicializar()
    }

    openModal(row) {
        const dialogRef = this.dialog.open(ABMPerfilesDialog, {
            width: '40%',
            data: {row: row},
        });
        dialogRef.afterClosed().subscribe(result => {
            this.inicializar()
        });
    }

    crearPerfil() {
        const dialogRef = this.dialog.open(ABMCrearPerfilDialog, {
            width: '60%',
        });
        dialogRef.afterClosed().subscribe(result => {
            this.inicializar()
        });
    }

    inicializar() {
        this.perfilesService.getPerfiles().subscribe(d=>{
            this.perfiles = d.data;
        })
    }
}
