import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Contacto } from "app/shared/models/cliente.model";
import { ClientesService } from "app/shared/services/clientes.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "../abm-clientes.service";

@Component({
    selector: 'abm-clientes-grilla-contactos',
    templateUrl: './abm-clientes-grilla-contactos.component.html',
    styleUrls: ['./abm-clientes-grilla-contactos.component.scss']
})

export class ABMClientesGrillaContactosComponent implements OnInit, OnDestroy {

    component = "GrillaContactos";
    clientes;
    displayedColumns: string[] = ['name', 'type', 'mail', 'phone', 'acciones'];
    clienteId: number;
    suscripcion: Subscription;



    constructor(
        private activatedRoute: ActivatedRoute,
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
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
        this.clientesService.getContactos(this.clienteId).subscribe(d => {
            this.clientes = d.data;
        });
        this.clientesService.getClienteById(this.clienteId).subscribe(d => {
            this.ABMClientesService.viewEvents.next(d.data.razonSocial);
        },
        err => {
            this.ABMClientesService.viewEvents.next("Nombre Cliente");
        })
    }

    editContacto(row) {
        this.router.navigateByUrl(`/clientes/${this.clienteId}/contacto/${row.id}`);
    }

    deleteContacto(row) {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: {data: row.nombre, seccion: "contacto", boton: "Eliminar"},
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.clientesService.deleteContacto(row.id).subscribe(d => {
                    if(d.status == "OK") {
                        this.openSnackBar("Cambios realizados", "X", "green-snackbar");
                        this.inicializar();
                    } else {
                        this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
                    }
                },
                err => {
                    this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
                })
            }
        });
        
    }

    create() {
        this.router.navigateByUrl(`/clientes/${this.clienteId}/crear-contacto`);
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}