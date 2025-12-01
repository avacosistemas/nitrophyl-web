import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Domicilio } from "app/shared/models/cliente.model";
import { ClientesService } from "app/shared/services/clientes.service";
import { NotificationService } from "app/shared/services/notification.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "../abm-clientes.service";

@Component({
    selector: 'abm-clientes-domicilio',
    templateUrl: './abm-clientes-domicilio.component.html'
})

export class ABMClientesDomicilioComponent implements OnInit, OnDestroy {

    component = "EditDomicilio";
    clienteId: number;
    domicilioId: number;
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
            id: [null],
            idCliente: [null],
            domicilio: [null, [Validators.required]],
            tipo: [null, [Validators.required]]
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
        this.domicilioId = this.activatedRoute.snapshot.params['idDomicilio'];
        console.log('Loading domicilio with ID:', this.domicilioId);
        this.clientesService.getDomicilioById(this.domicilioId).subscribe(d => {
            console.log('Domicilio data received:', d);
            this.domicilioForm.patchValue({
                id: this.domicilioId,
                idCliente: this.clienteId,
                domicilio: d.data.domicilio,
                tipo: d.data.tipo
            });
            console.log('Form values after patch:', this.domicilioForm.value);
        },
            err => {
                console.error('Error loading domicilio:', err);
            });
        this.clientesService.getClienteById(this.clienteId).subscribe(d => {
            this.ABMClientesService.viewEvents.next(d.data.nombre);
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
        let model: Domicilio = {
            ...this.domicilioForm.getRawValue()
        };
        this.clientesService.updateDomicilio(this.domicilioId, model).subscribe(d => {
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
