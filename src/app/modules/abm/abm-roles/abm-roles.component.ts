import { AfterContentChecked, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { RolesService } from 'app/shared/services/roles.service';
import { ABMRolService } from './abm-roles.service';

@Component({
    selector     : 'abm-roles',
    templateUrl  : './abm-roles.component.html',
    styleUrls: ['./abm-roles.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ABMRolesComponent implements OnInit, AfterContentChecked
{
    titulo: string;

    constructor(
        private router: Router,
        private rolesService: RolesService,
        private ABMRolService: ABMRolService,
        private cdref: ChangeDetectorRef) { }

    ngOnInit(): void {
        
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges()
    }

    componentAdded(event) {
        if(event.component == "Grilla") {
            this.titulo = "Consulta Roles"
        }
        if(event.component == "Rol") {
            if(this.rolesService.getMode() == "Edit"){
                this.titulo = "Edición Rol";
            }
            if(this.rolesService.getMode() == "View" || this.rolesService.getMode() == undefined) {
                this.titulo = "Vista Rol";
            }
        }
        if(event.component == "Create") {
            this.titulo = "Nuevo Rol"
        }
    }

    edit() {
        this.ABMRolService.events.next(2)
    }

    editContinue() {
        this.ABMRolService.events.next(3)
    }

    close() {
        this.ABMRolService.events.next(1)
    }

    create() {
        this.rolesService.setMode("Create")
        this.router.navigate(['../roles/create']);
    }

    save() {
        this.ABMRolService.events.next(4)
    }
}
