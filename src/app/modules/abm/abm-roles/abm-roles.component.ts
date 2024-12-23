import { AfterContentChecked, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { RolesService } from 'app/shared/services/roles.service';
import { ABMRolService } from './abm-roles.service';

@Component({
    selector: 'abm-roles',
    templateUrl: './abm-roles.component.html',
    styleUrls: ['./abm-roles.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ABMRolesComponent implements OnInit, AfterContentChecked {
    titulo: string;

    constructor(
        private router: Router,
        private rolesService: RolesService,
        private _abmRolService: ABMRolService,
        private cdref: ChangeDetectorRef) { }

    ngOnInit(): void { }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }

    handleAction(action: string): void {
        switch (action) {
            case 'edit':
                this.edit();
                break;
            case 'save':
                this.save();
                break;
            case 'editContinue':
                this.editContinue();
                break;
            case 'close':
                this.close();
                break;
            case 'create':
                this.create();
                break;
        }
    }

    componentAdded(event): void {
        if (event.component === 'Grilla') {
            this.titulo = 'Consulta Roles';
        }
        if (event.component === 'Rol') {
            if (this.rolesService.getMode() === 'Edit') {
                this.titulo = 'Edición Rol';
            }
            if (this.rolesService.getMode() === 'View' || this.rolesService.getMode() === undefined) {
                this.titulo = 'Vista Rol';
            }
        }
        if (event.component === 'Create') {
            this.titulo = 'Nuevo Rol';
        }
    }

    edit(): void {
        this._abmRolService.events.next(2);
    }

    editContinue(): void {
        this._abmRolService.events.next(3);
    }

    close(): void {
        this._abmRolService.events.next(1);
    }

    create(): void {
        this.rolesService.setMode('Create');
        this.router.navigate(['../roles/create']);
    }

    save(): void {
        this._abmRolService.events.next(4);
    }
}
