import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { ClientesService } from "app/shared/services/clientes.service";
import { NotificationService } from "app/shared/services/notification.service";
import { Subscription } from "rxjs";
import { ABMClientesService } from "../abm-clientes.service";

@Component({
    selector: 'abm-clientes-grilla-domicilios',
    templateUrl: './abm-clientes-grilla-domicilios.component.html',
    styleUrls: ['./abm-clientes-grilla-domicilios.component.scss']
})

export class ABMClientesGrillaDomiciliosComponent implements OnInit, OnDestroy {

    component = "GrillaDomicilios";
    domicilios;
    displayedColumns: string[] = ['domicilio', 'tipo', 'acciones'];
    clienteId: number;
    suscripcion: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        private clientesService: ClientesService,
        private ABMClientesService: ABMClientesService,
        private router: Router,
        private notificationService: NotificationService,
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
        this.inicializar();
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
        this.clientesService.getDomicilios(this.clienteId).subscribe(d => {
            this.domicilios = d.data;
        });
        this.clientesService.getClienteById(this.clienteId).subscribe(d => {
            this.ABMClientesService.viewEvents.next(d.data.razonSocial);
        },
            err => {
                this.ABMClientesService.viewEvents.next("Nombre Cliente");
            })
    }

    editDomicilio(row) {
        this.router.navigateByUrl(`/clientes/${this.clienteId}/domicilio/${row.id}`);
    }

    deleteDomicilio(row) {
        const dialogRef = this.dialog.open(RemoveDialogComponent, {
            maxWidth: '40%',
            data: { data: row.domicilio, seccion: "domicilio", boton: "Eliminar" },
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.clientesService.deleteDomicilio(row.id).subscribe(d => {
                    if (d.status == "OK") {
                        this.notificationService.showSuccess("Cambios realizados.");
                        this.inicializar();
                    } else {
                        this.notificationService.showError("No se pudieron realizar los cambios.");
                    }
                },
                    err => {
                        this.notificationService.showError("No se pudieron realizar los cambios.");
                    })
            }
        });
    }

    create() {
        this.router.navigateByUrl(`/clientes/${this.clienteId}/crear-domicilio`);   
    }
}
