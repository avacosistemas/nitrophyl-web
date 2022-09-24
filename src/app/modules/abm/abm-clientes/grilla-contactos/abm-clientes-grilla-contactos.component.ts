import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Contacto } from "app/shared/models/cliente.model";
import { ClientesService } from "app/shared/services/clientes.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "../abm-clientes.service";

const ELEMENT_DATA: Contacto[] = [
    {
        id: 1,
        tipo: "Compras",
        nombre: "Contacto 1",
        mail: 'contacto1@mail.com',
        telefono: '3411111111',
    },
    {
        id: 2,
        tipo: "Compras",
        nombre: "Contacto 2",
        mail: 'contacto2@mail.com',
        telefono: '3411111111',
    },
    {
        id: 3,
        tipo: "Contaduría",
        nombre: "Contacto 3",
        mail: 'contacto3@mail.com',
        telefono: '3411111111',
    },
    {
        id: 4,
        tipo: "Calidad",
        nombre: "Contacto 4",
        mail: 'contacto4@mail.com',
        telefono: '3411111111',
    },
    {
        id: 5,
        tipo: "Compras",
        nombre: "Contacto 5",
        mail: 'contacto5@mail.com',
        telefono: '3411111111',
    },
];

@Component({
    selector: 'abm-clientes-grilla-contactos',
    templateUrl: './abm-clientes-grilla-contactos.component.html',
    styleUrls: ['./abm-clientes-grilla-contactos.component.scss']
})

export class ABMClientesGrillaContactosComponent implements OnInit, OnDestroy {

    component = "GrillaContactos";
    clientes = ELEMENT_DATA;
    displayedColumns: string[] = ['name', 'type', 'mail', 'phone', 'acciones'];
    clienteId: number;
    suscripcion: Subscription;



    constructor(
        private activatedRoute: ActivatedRoute,
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router
    ) {
        this.suscripcion = this.ABMClientesService.events.subscribe(
            (data: any) => {
                if (data == 5) {
                    this.create();
                }
            }
        )
    }

    ngOnInit(): void {
        this.inicializar()
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
            top.scrollIntoView();
            top = null;
        }
    }

    inicializar() {
        this.clienteId = this.activatedRoute.snapshot.params['idCliente'];
        //GET grilla contactos
        //GET nombre cliente
        this.ABMClientesService.viewEvents.next("Nombre Cliente");
    }

    editContacto(row) {
        //redirigir a edición id contacto
        this.router.navigateByUrl(`/clientes/${this.clienteId}/contacto/${row.id}`);
    }

    deleteContacto(row) {
        //modal de confirmación y eliminar contacto
    }

    create() {
        this.router.navigateByUrl(`/clientes/${this.clienteId}/crear-contacto`);
    }
}