import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Subscription } from 'rxjs';
import { ABMClientesService } from './abm-clientes.service';

@Component({
    selector: 'abm-clientes',
    templateUrl: './abm-clientes.component.html',
    styleUrls: ['./abm-clientes.component.scss']
})

export class ABMClientesComponent implements OnInit, AfterContentChecked, OnDestroy {
    titulo: string = '';
    suscripcion: Subscription;
    botonEdicion: string = '';
    subTitulo: string = null;

    constructor(
        private clientesService: ClientesService,
        private abmClientesSvc: ABMClientesService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) {
        this.suscripcion = this.abmClientesSvc.viewEvents.subscribe(
            (data: string) => {
                this.subTitulo = data;
            }
        );
    }

    handleAction(action: string): void {
        switch (action) {
            case 'save':
                this.save();
                break;
            case 'close':
                this.close();
                break;
            case 'goToClientes':
                this.router.navigate(['../clientes/grid']);
                break;
            case 'createCliente':
                this.create();
                break;
            case 'createContacto':
                this.createContacto();
                break;
            case 'saveContacto':
                this.save();
                break;
            case 'createDomicilio':
                this.createDomicilio();
                break;
            case 'saveDomicilio':
                this.save();
                break;
        }
    }

    ngOnInit(): void {
        this.botonEdicion = 'Guardar Molde';
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    componentAdded(event: { component: string }): void {
        this.subTitulo = null;
        if (event.component === 'Grilla') {
            this.titulo = 'Consulta Clientes';
        }
        if (event.component === 'Molde') {
            if (this.clientesService.getMode() === 'Edit') {
                this.titulo = 'Edición Cliente';
            }
            if (this.clientesService.getMode() === 'View' || this.clientesService.getMode() === undefined) {
                this.titulo = 'Vista Cliente';
            }
        }
        if (event.component === 'CreateCliente') {
            this.titulo = 'Nuevo Cliente';
        }
        if (event.component === 'GrillaContactos') {
            this.titulo = 'Consulta Contactos';
        }
        if (event.component === 'CreateContacto') {
            this.titulo = 'Nuevo Contacto';
        }
        if (event.component === 'EditContacto') {
            this.titulo = 'Edición Contacto';
        }
        if (event.component === 'GrillaDomicilios') {
            this.titulo = 'Consulta Domicilios';
        }
        if (event.component === 'CreateDomicilio') {
            this.titulo = 'Nuevo Domicilio';
        }
        if (event.component === 'EditDomicilio') {
            this.titulo = 'Edición Domicilio';
        }
    }

    edit(): void {
        this.abmClientesSvc.events.next(2);
    }

    close(): void {
        this.abmClientesSvc.events.next(1);
    }

    create(): void {
        this.clientesService.setMode('Create');
        this.router.navigate(['../clientes/create']);
    }

    createContacto(): void {
        this.abmClientesSvc.events.next(5);
    }

    createDomicilio(): void {
        this.abmClientesSvc.events.next(5);
    }

    save(): void {
        this.abmClientesSvc.events.next(4);
    }
}
