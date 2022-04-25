import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PermisosService } from 'app/shared/services/permisos.service';
import { ABMPermisoService } from './abm-permisos.service';

@Component({
    selector     : 'abm-permisos',
    templateUrl  : './abm-permisos.component.html',
    styleUrls: ['./abm-permisos.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ABMPermisosComponent implements OnInit {
    
    titulo: string = "";

    constructor(
        private router: Router,
        private ABMPermisoService: ABMPermisoService,
        private permisosService: PermisosService
    ) {}

    ngOnInit(): void {
        
    }

    componentAdded(event) {
        if(event.component == "Grilla") {
            this.titulo = "Consulta Permisos"
        }
        if(event.component == "Permiso") {
            if(this.permisosService.getMode() == "Edit"){
                this.titulo = "Edición Permiso";
            }
            if(this.permisosService.getMode() == "View" || this.permisosService.getMode() == undefined) {
                this.titulo = "Vista Permiso";
            }
        }
        if(event.component == "Create") {
            this.titulo = "Nuevo Permiso"
        }
    }

    edit() {
        this.ABMPermisoService.events.next(2)
    }

    editContinue() {
        this.ABMPermisoService.events.next(3)
    }

    close() {
        this.ABMPermisoService.events.next(1)
    }

    create() {
        this.permisosService.setMode("Create")
        this.router.navigate(['../permisos/create']);
    }

    save() {
        this.ABMPermisoService.events.next(4)
    }

}
