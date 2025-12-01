import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { ClientesService } from "app/shared/services/clientes.service";
import { NotificationService } from "app/shared/services/notification.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "../abm-clientes.service";

@Component({
    selector: 'abm-clientes-crear-domicilio',
    templateUrl: './abm-clientes-crear-domicilio.component.html'
})

export class ABMClientesCrearDomicilioComponent implements OnInit, OnDestroy {

    component = "CreateDomicilio";
    clienteId: number;
    suscripcion: Subscription;
    domicilioForm: FormGroup;

    constructor(
        private activatedRoute: ActivatedRoute,
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router,
        private formBuilder: FormBuilder,
        private notificationService: NotificationService,
        public dialog: MatDialog
    ) {
        this.domicilioForm = this.formBuilder.group({
            idCliente: [null],
            domicilio: [null, [Validators.required]],
            tipo: [null, [Validators.required]]
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
        this.clientesService.getClienteById(this.clienteId).subscribe(d => {
            this.ABMClientesService.viewEvents.next(d.data.razonSocial);
        },
            err => {
                this.ABMClientesService.viewEvents.next("Nombre Cliente");
            });
    }

    save() {
        this.domicilioForm.markAllAsTouched();
        if (this.domicilioForm.invalid) {
            return;
        };
        let model: any = {
            ...this.domicilioForm.getRawValue()
        };
        model.idCliente = this.clienteId;
        this.clientesService.createDomicilio(model).subscribe(d => {
            if (d.status == "OK") {
                this.notificationService.showSuccess("Cambios realizados.");
                this.router.navigateByUrl(`/clientes/${this.clienteId}/grid-domicilios`);
            } else {
                this.notificationService.showError("No se pudieron realizar los cambios.");
            }
        },
            err => {
                this.notificationService.showError("No se pudieron realizar los cambios.");
            })
    }

    close() {
        if (this.domicilioForm.pristine == true) {
            this.router.navigate([`/clientes/${this.clienteId}/grid-domicilios`])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: "domicilio", boton: "Cerrar" },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate([`/clientes/${this.clienteId}/grid-domicilios`]);
                }
            });
        }
    }
}
