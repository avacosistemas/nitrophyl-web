import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Cliente } from "app/shared/models/cliente.model";
import { ClientesService } from "app/shared/services/clientes.service";

const ELEMENT_DATA: Cliente[] = [
    {
        id: 1,
        razonSocial: 'Cliente 1',
        mail: 'cliente1@mail.com',
        cuit: 11111111111,
        direccion: 'Dirección 1',
        codigoPostal: '2000',
        localidad: 'Rosario',
        celular: '3411111111',
        telefono: '3411111111',
        pagina: 'pagina1.web',
        ingresosBrutos: '111111111'
    },
    {
        id: 2,
        razonSocial: 'Cliente 2',
        mail: 'cliente2@mail.com',
        cuit: 22222222222,
        direccion: 'Dirección 2',
        codigoPostal: '2000',
        localidad: 'Rosario',
        celular: '3412222222',
        telefono: '3412222222',
        pagina: 'pagina2.web',
        ingresosBrutos: '222222222'
    },
    {
        id: 3,
        razonSocial: 'Cliente 3',
        mail: 'cliente3@mail.com',
        cuit: 33333333333,
        direccion: 'Dirección 3',
        codigoPostal: '2000',
        localidad: 'Rosario',
        celular: '3413333333',
        telefono: '3413333333',
        pagina: 'pagina3.web',
        ingresosBrutos: '333333333'
    },
    {
        id: 4,
        razonSocial: 'Cliente 4',
        mail: 'cliente4@mail.com',
        cuit: 44444444444,
        direccion: 'Dirección 4',
        codigoPostal: '2000',
        localidad: 'Rosario',
        celular: '3414444444',
        telefono: '3414444444',
        pagina: 'pagina4.web',
        ingresosBrutos: '4444444444'
    },
    {
        id: 5,
        razonSocial: 'Cliente 5',
        mail: 'cliente5@mail.com',
        cuit: 55555555555,
        direccion: 'Dirección 5',
        codigoPostal: '2000',
        localidad: 'Rosario',
        celular: '3415555555',
        telefono: '3415555555',
        pagina: 'pagina5.web',
        ingresosBrutos: '5555555555555'
    }
];

@Component({
    selector: 'abm-clientes-grilla',
    templateUrl: './abm-clientes-grilla.component.html',
    styleUrls: ['./abm-clientes-grilla.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})

export class ABMClientesGrillaComponent implements OnInit {
    component = "Grilla";
    clienteForm: FormGroup;
    dataSource = ELEMENT_DATA;
    columnsToDisplay = ['razonSocial', 'mail', 'cuit'];
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    expandedElement: Cliente | null;



    constructor(
        private clientesService: ClientesService,
        private formBuilder: FormBuilder,
        private router: Router
    ) {
        this.clienteForm = this.formBuilder.group({
            razonSocial: [null, [Validators.required]],
            mail: [null, [Validators.required]],
            cuit: [null, [Validators.required]],
            direccion: [null, [Validators.required]],
            codigoPostal: [null, [Validators.required]],
            localidad: [null, [Validators.required]],
            celular: [null, [Validators.required]],
            telefono: [null, [Validators.required]],
            pagina: [null, [Validators.required]],
            ingresosBrutos: [null, [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.inicializar()
    }

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
            top.scrollIntoView();
            top = null;
        }
    }

    inicializar() {
        //GET grilla clientes
    }

    expandRow(element) {
        console.log(element);
        this.clienteForm.patchValue({
            razonSocial: element.razonSocial,
            mail: element.mail,
            cuit: element.cuit,
            direccion: element.direccion,
            codigoPostal: element.codigoPostal,
            localidad: element.localidad,
            celular: element.celular,
            telefono: element.telefono,
            pagina: element.pagina,
            ingresosBrutos: element.ingresosBrutos
        })
        this.expandedElement = this.expandedElement === element ? null : element;
    }

    updateCliente() {
        console.log(this.clienteForm.value)
    }

    verContacto(element) {
        console.log(element.id);
        //Abrir contactos con id de cliente
        this.router.navigateByUrl(`/clientes/${element.id}/grid-contactos`);

    }
}