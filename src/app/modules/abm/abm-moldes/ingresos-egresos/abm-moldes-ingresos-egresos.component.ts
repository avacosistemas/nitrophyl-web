import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { IngresoEgresoDialogComponent } from "app/modules/prompts/ingreso-egreso/ingreso-egreso.component";
import { MoldeRegistro } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";
import { Subscription } from "rxjs";
import { ABMMoldeService } from "../abm-moldes-service";



@Component({
    selector: 'abm-moldes-ingresos-egresos',
    templateUrl: './abm-moldes-ingresos-egresos.component.html'
})

export class ABMMoldesIngresosEgresosComponent implements OnInit, OnDestroy{
    component = "Ingresos / Egresos";
    displayedColumns: string[] = ['date', 'type', 'comments'];
    ingresosEgresos: Array<MoldeRegistro> = [];
    currentId: number;
    suscripcion: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private moldesService: MoldesService,
        private ABMoldesService: ABMMoldeService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        this.suscripcion = this.ABMoldesService.events.subscribe(
            (data: any) => {
                if (data == 1) {
                    this.close();
                } else if (data == 5) {
                    this.openModal();
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
        this.currentId = this.activatedRoute.snapshot.params['id'];
        this.moldesService.getMoldeRegistro(this.currentId).subscribe(d => {
            this.ingresosEgresos = d.data;
            if (d.data.length % 2 == 0) {
                this.ABMoldesService.viewEvents.next("Registrar Ingreso");
            } else {
                this.ABMoldesService.viewEvents.next("Registrar Egreso");
            }
        });
    }

    close() {
        this.router.navigate(['/moldes/grid']);
    }

    openModal() {
        const dialogRef = this.dialog.open(IngresoEgresoDialogComponent, {
            width: '100%',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                let model: MoldeRegistro = {
                    comentarios: result,
                    fechaHora:"",
                    id: 0,
                    idMolde: this.currentId,
                    tipo: ""
                }
                this.moldesService.addMoldeRegistro(this.currentId, model).subscribe(d => {
                    if(d.status == "OK") {
                        this.openSnackBar("Cambios realizados", "X", "green-snackbar");
                        if(d.data.tipo == "EGRESO") {
                            this.ABMoldesService.viewEvents.next("Registrar Ingreso");
                        } else {
                            this.ABMoldesService.viewEvents.next("Registrar Egreso");
                        }
                        this.inicializar();
                    } else {
                        this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
                    }
                })
                
            }
        });
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}