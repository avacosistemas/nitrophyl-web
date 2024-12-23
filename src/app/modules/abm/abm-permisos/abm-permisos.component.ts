import { AfterContentChecked, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PermisosService } from 'app/shared/services/permisos.service';
import { ABMPermisoService } from './abm-permisos.service';

@Component({
    selector: 'abm-permisos',
    templateUrl: './abm-permisos.component.html',
    styleUrls: ['./abm-permisos.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ABMPermisosComponent implements OnInit, AfterContentChecked {

    titulo: string = '';

    constructor(
        private router: Router,
        private _abmPermisoService: ABMPermisoService,
        private permisosService: PermisosService,
        private cdref: ChangeDetectorRef
    ) { }

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
            this.titulo = 'Consulta Permisos';
        }
        if (event.component === 'Permiso') {
            if (this.permisosService.getMode() === 'Edit') {
                this.titulo = 'Edición Permiso';
            }
            if (this.permisosService.getMode() === 'View' || this.permisosService.getMode() === undefined) {
                this.titulo = 'Vista Permiso';
            }
        }
        if (event.component === 'Create') {
            this.titulo = 'Nuevo Permiso';
        }
    }

    edit(): void {
        this._abmPermisoService.events.next(2);
    }

    editContinue(): void {
        this._abmPermisoService.events.next(3);
    }

    close(): void {
        this._abmPermisoService.events.next(1);
    }

    create(): void {
        this.permisosService.setMode('Create');
        this.router.navigate(['../permisos/create']);
    }

    save(): void {
        this._abmPermisoService.events.next(4);
    }

}
