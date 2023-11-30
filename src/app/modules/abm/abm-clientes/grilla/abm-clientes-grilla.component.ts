import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { Cliente } from "app/shared/models/cliente.model";
import { ClientesService } from "app/shared/services/clientes.service";

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
    dataSource;
    columnsToDisplay = ['razonSocial', 'nombre', 'mail', 'cuit'];
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    expandedElement: Cliente | null;
    provincias = [];
    ingresosBrutos = [
        {id: 1, name: "Régimen General"},
        {id: 2, name: "Régimen Simplificado"}
    ];

    constructor(
        private clientesService: ClientesService,
        private formBuilder: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.clienteForm = this.formBuilder.group({
            id: [null],
            razonSocial: [null, [Validators.required]],
            email: [null, [Validators.required]],
            cuit: [null, [Validators.required]],
            domicilio: [null, [Validators.required]],
            codigoPostal: [null, [Validators.required]],
            localidad: [null, [Validators.required]],
            provincia: [null, [Validators.required]],
            webSite: [null],
            nombre:  [null, [Validators.required]],
            observacionesCobranzas: [null],
            observacionesEntrega: [null],
			observacionesFacturacion: [null],
			telefono: [null, [Validators.required]]
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
        this.clientesService.getClientes().subscribe(d => {
            this.dataSource = d.data;
        });
        this.clientesService.getProvincias().subscribe(d => {
            this.provincias = d.data;
        });
    }

    expandRow(element) {
        this.clienteForm.patchValue({
            id: element.id,
            nombre: element.nombre,
            razonSocial: element.razonSocial,
            email: element.email,
            cuit: element.cuit,
            domicilio: element.domicilio,
            codigoPostal: element.codigoPostal,
            localidad: element.localidad,
            webSite: element.webSite,
            provincia: element.provincia,
            observacionesCobranzas: element.observacionesCobranzas,
			observacionesFacturacion: element.observacionesFacturacion,
 			telefono: element.telefono        })
        this.expandedElement = this.expandedElement === element ? null : element;
    }

    updateCliente() {
        this.clienteForm.markAllAsTouched();
        if(!this.clienteForm.valid) {
            return;
        }
        let model: Cliente = {
            ...this.clienteForm.getRawValue(),
        };
        this.clientesService.updateCliente(model.id, model).subscribe(d => {
            if(d.status == "OK") {
                this.openSnackBar("Cambios realizados", "X", "green-snackbar");
            } else {
                this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
            }
        },
        err => {
            this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
        })
    }

    verContacto(element) {
        this.router.navigateByUrl(`/clientes/${element.id}/grid-contactos`);
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}