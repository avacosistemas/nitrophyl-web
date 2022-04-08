import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Permiso } from 'app/shared/models/permiso.model';
import { PermisosService } from 'app/shared/services/permisos.service';
import { ABMPermisosDialog } from './dialog/abm-permisos-dialog.component';

@Component({
    selector     : 'abm-permisos',
    templateUrl  : './abm-permisos.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMPermisosComponent implements OnInit
{
    
    permisos: Array<Permiso> = [];
    displayedColumns: string[] = ['id', 'code', 'description', 'enabled']

    constructor(
        private permisosService: PermisosService,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.permisosService.getPermisos().subscribe(d=>{
            this.permisos = d.data
        })
    }

    openModal(row) {
        console.log(row);
        const dialogRef = this.dialog.open(ABMPermisosDialog, {
            width: '250px',
            data: {row: row},
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
          });
    }
}
