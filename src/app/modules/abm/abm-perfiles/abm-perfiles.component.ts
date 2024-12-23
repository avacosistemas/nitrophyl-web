import { AfterContentChecked, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PerfilesService } from 'app/shared/services/perfiles.service';
import { UserService } from 'app/shared/services/user.service';
import { ABMPerfilService } from './abm-perfiles.service';

@Component({
    selector: 'abm-perfiles',
    templateUrl: './abm-perfiles.component.html',
    styleUrls: ['./abm-perfiles.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ABMPerfilesComponent implements OnInit, AfterContentChecked {
    titulo: string = '';

    constructor(
        private perfilesService: PerfilesService,
        private _abmPerfilesService: ABMPerfilService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
    }

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
            this.titulo = 'Consulta Perfiles';
        }
        if (event.component === 'Perfil') {
            if (this.perfilesService.getMode() === 'Edit') {
                this.titulo = 'Edición Perfil';
            }
            if (this.perfilesService.getMode() === 'View' || this.perfilesService.getMode() === undefined) {
                this.titulo = 'Vista Perfil';
            }
        }
        if (event.component === 'Create') {
            this.titulo = 'Nuevo Perfil';
        }
    }

    edit(): void {
        this._abmPerfilesService.events.next(2);
    }

    editContinue(): void {
        this._abmPerfilesService.events.next(3);
    }

    close(): void {
        this._abmPerfilesService.events.next(1);
    }

    create(): void {
        this.perfilesService.setMode('Create');
        this.router.navigate(['../perfiles/create']);
    }

    save(): void {
        this._abmPerfilesService.events.next(4);
    }
}
