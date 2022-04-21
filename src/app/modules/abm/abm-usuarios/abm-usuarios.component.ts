import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'app/shared/services/user.service';
import { ABMService } from './abm-usuarios.service';

@Component({
    selector     : 'abm-usuarios',
    templateUrl  : './abm-usuarios.component.html',
    styleUrls: ['./abm-usuarios.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ABMUsuariosComponent implements OnInit
{
    titulo: string = "";

    constructor(
        private usuariosService: UserService,
        private abmService: ABMService,
        private router: Router
    ) { }

    ngOnInit(): void {
    }

    componentAdded(event) {
        if(event.component == "Grilla") {
            this.titulo = "Consulta Usuarios"
        }
        if(event.component == "User") {
            if(this.usuariosService.getMode() == "Edit"){
                this.titulo = "Edición Usuario";
            }
            if(this.usuariosService.getMode() == "View" || this.usuariosService.getMode() == undefined) {
                this.titulo = "Vista Usuario";
            }
        }
        if(event.component == "Create") {
            this.titulo = "Nuevo Usuario"
        }
    }

    edit() {
        this.abmService.events.next(2)
    }

    editContinue() {
        this.abmService.events.next(3)
    }

    close() {
        this.abmService.events.next(1)
    }

    create() {
        this.usuariosService.setMode("Create")
        this.router.navigate(['../usuarios/create']);
    }

    save() {
        this.abmService.events.next(4)
    }
}
