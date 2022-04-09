import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Permiso } from 'app/shared/models/permiso.model';
import { PermisosService } from 'app/shared/services/permisos.service';
import { ABMPermisosDialog } from './dialog/abm-permisos-dialog.component';

@Component({
    selector     : 'abm-permisos',
    templateUrl  : './abm-permisos.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ABMPermisosComponent implements OnInit {
    
    permisos: Array<Permiso> = [];
    displayedColumns: string[] = ['id', 'code', 'description', 'enabled'];
    dataSource: any;

    constructor(
        private permisosService: PermisosService,
        public dialog: MatDialog
    ) {}

    @ViewChild(MatSort, {static: true}) sort!: MatSort;

    ngOnInit(): void {
        this.permisosService.getPermisos().subscribe(d=>{
            this.permisos = d.data;
            this.dataSource = new MatTableDataSource<Permiso>(this.permisos);
            this.dataSource.sort = this.sort;
        })
    }

    openModal(row) {
        console.log(row);
        const dialogRef = this.dialog.open(ABMPermisosDialog, {
            width: '40%',
            data: {row: row},
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
          });
    }
}
