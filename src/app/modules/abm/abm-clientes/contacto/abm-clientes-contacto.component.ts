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
    selector: 'abm-clientes-contacto',
    templateUrl : './abm-clientes-contacto.component.html'
})

export class ABMClientesContactoComponent implements OnInit, OnDestroy {

    component = "EditContacto";
    displayedColumns: string[] = ['type', 'name', 'mail', 'phone', 'acciones'];
    clienteId: number;
    contactoId: number;
    suscripcion: Subscription;
    contactoFrom: FormGroup;



    constructor(
        private activatedRoute: ActivatedRoute,
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router,
        private formBuilder: FormBuilder,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) {
        this.contactoFrom = this.formBuilder.group({
            id: [null],
            idCliente: [null],
            tipo: [null, [Validators.required]],
            nombre: [null, [Validators.required]],
            email: [null, [Validators.required]],
            telefono: [null, [Validators.required]]
        });
        this.suscripcion = this.ABMClientesService.events.subscribe(
            (data: any) => {
                if (data == 4) {
                    this.save();
                } else if (data == 1) {
                    this.close();
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
        this.contactoId = this.activatedRoute.snapshot.params['idContacto'];
        this.clientesService.getContactoById(this.contactoId).subscribe(d => {
            this.contactoFrom.patchValue({
                id: this.contactoId,
                idCliente: this.clienteId,
                tipo: d.data.tipo,
                nombre: d.data.nombre,
                email: d.data.email,
                telefono: d.data.telefono
            })
        },
        err => {
            console.log(err)
        });
        this.clientesService.getClienteById(this.clienteId).subscribe(d => {
            this.ABMClientesService.viewEvents.next(d.data.razonSocial);
        },
        err => {
            this.ABMClientesService.viewEvents.next("Nombre Cliente");
        });
    }

    save() {
        this.contactoFrom.markAllAsTouched();
        if(this.contactoFrom.invalid) {
            return;
        };
        let model: Contacto = {
            ...this.contactoFrom.getRawValue()
        };
        this.clientesService.updateContacto(this.contactoId, model).subscribe(d => {
            if(d.status == "OK") {
                this.openSnackBar("Cambios realizados", "X", "green-snackbar");
                this.router.navigateByUrl(`/clientes/${this.clienteId}/grid-contactos`);
            } else {
                this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
            }
        },
        err => {
            this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
        })
    }

    close() {
        if (this.contactoFrom.pristine == true) {
            this.router.navigate([`/clientes/${this.clienteId}/grid-contactos`])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: "contacto", boton: "Cerrar" },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate([`/clientes/${this.clienteId}/grid-contactos`]);
                }
            });
        }
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}