import { AfterContentChecked, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PerfilesService } from 'app/shared/services/perfiles.service';
import { UserService } from 'app/shared/services/user.service';
import { ABMPerfilService } from './abm-perfiles.service';

@Component({
    selector     : 'abm-perfiles',
    templateUrl  : './abm-perfiles.component.html',
    styleUrls: ['./abm-perfiles.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ABMPerfilesComponent implements OnInit, AfterContentChecked
{
    titulo: string = "";

    constructor(
        private perfilesService: PerfilesService,
        private ABMPerfilesService: ABMPerfilService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges()
    }

    componentAdded(event) {
        if(event.component == "Grilla") {
            this.titulo = "Consulta Perfiles"
        }
        if(event.component == "Perfil") {
            if(this.perfilesService.getMode() == "Edit"){
                this.titulo = "Edición Perfil";
            }
            if(this.perfilesService.getMode() == "View" || this.perfilesService.getMode() == undefined) {
                this.titulo = "Vista Perfil";
            }
        }
        if(event.component == "Create") {
            this.titulo = "Nuevo Perfil"
        }
    }

    edit() {
        this.ABMPerfilesService.events.next(2)
    }

    editContinue() {
        this.ABMPerfilesService.events.next(3)
    }

    close() {
        this.ABMPerfilesService.events.next(1)
    }

    create() {
        this.perfilesService.setMode("Create")
        this.router.navigate(['../perfiles/create']);
    }

    save() {
        this.ABMPerfilesService.events.next(4)
    }
}
