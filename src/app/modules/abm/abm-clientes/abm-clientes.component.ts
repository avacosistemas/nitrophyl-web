import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ClientesService } from "app/shared/services/clientes.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "./abm-clientes.service";

@Component({
    selector: 'abm-clientes',
    templateUrl: './abm-clientes.component.html',
    styleUrls: ['./abm-clientes.component.scss']
})

export class ABMClientesComponent implements OnInit, AfterContentChecked, OnDestroy{
    titulo: string = "";
    suscripcion: Subscription;
    botonEdicion: string = "";
    subTitulo: string = null;

    constructor(
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) {
        this.suscripcion = this.ABMClientesService.viewEvents.subscribe(
            (data: string) => {
                this.subTitulo = data;
            }
        )
    }

    ngOnInit(): void {
        this.botonEdicion = "Guardar Molde"
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges()
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    componentAdded(event) {
        this.subTitulo = null;
        if (event.component == "Grilla") {
            this.titulo = "Consulta Clientes";
        }
        if (event.component == "Molde") {
            if (this.clientesService.getMode() == "Edit") {
                this.titulo = "Edición Cliente";
            }
            if (this.clientesService.getMode() == "View" || this.clientesService.getMode() == undefined) {
                this.titulo = "Vista Cliente";
            }
        }
        if (event.component == "CreateCliente") {
            this.titulo = "Nuevo Cliente"
        }
        if (event.component == "GrillaContactos") {
            this.titulo = "Consulta Contactos";
        }
        if (event.component == "CreateContacto") {
            this.titulo = "Nuevo Contacto";
        }
        if (event.component == "EditContacto") {
            this.titulo = "Edición Contacto";
        }
    }

    edit() {
        this.ABMClientesService.events.next(2)
    }

    close() {
        this.ABMClientesService.events.next(1)
    }

    create() {
        this.clientesService.setMode("Create")
        this.router.navigate(['../clientes/create']);
    }

    createContacto() {
        this.ABMClientesService.events.next(5);
    }

    save() {
        this.ABMClientesService.events.next(4)
    }
}