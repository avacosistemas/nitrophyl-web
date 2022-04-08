import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PerfilesService } from 'app/shared/services/perfiles.service';
import { ABMPerfilesDialog } from './dialog/abm-perfiles-dialog.component';
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
        this.perfilesService.getPerfiles().subscribe(d=>{
            this.perfiles = d.data;
            console.log(d)
        })
    }

    openModal(row) {
        console.log(row);
        const dialogRef = this.dialog.open(ABMPerfilesDialog, {
            width: '40%',
            data: {row: row},
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
          });
    }
}
