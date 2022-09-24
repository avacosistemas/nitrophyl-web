import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Contacto } from "app/shared/models/cliente.model";
import { ClientesService } from "app/shared/services/clientes.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "../abm-clientes.service";

@Component({
    selector: 'abm-clientes-crear-contacto',
    templateUrl: './abm-clientes-crear-contacto.component.html'
})

export class ABMClientesCrearContactoComponent implements OnInit, OnDestroy {

    component = "CreateContacto";
    displayedColumns: string[] = ['type', 'name', 'mail', 'phone', 'acciones'];
    clienteId: number;
    suscripcion: Subscription;
    contactoFrom: FormGroup;



    constructor(
        private activatedRoute: ActivatedRoute,
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router,
        private formBuilder: FormBuilder
    ) {
        this.contactoFrom = this.formBuilder.group({
            tipo: [null, [Validators.required]],
            nombre: [null, [Validators.required]],
            mail: [null, [Validators.required]],
            telefono: [null, [Validators.required]]
        });
        this.suscripcion = this.ABMClientesService.events.subscribe(
            (data: any) => {
                if (data == 4) {
                    this.save();
                } else if (data == 1) {
                    this.close()
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
        //GET nombre cliente
        this.ABMClientesService.viewEvents.next("Nombre Cliente");
    }

    save() {
        this.contactoFrom.markAllAsTouched();
        console.log(this.contactoFrom.value)
    }

    close() {
        //modal de salir y perder cambios
        this.router.navigateByUrl(`/clientes/${this.clienteId}/grid-contactos`);
    }
}