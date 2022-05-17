import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MoldesService } from "app/shared/services/moldes.service";
import { Subscription } from "rxjs";
import { ABMMoldeService } from "./abm-moldes-service";

@Component({
    selector: 'abm-moldes',
    templateUrl: './abm-moldes.component.html',
    styleUrls: ['./abm-moldes.component.scss']
})

export class ABMMoldesComponent implements OnInit, AfterContentChecked, OnDestroy{
    titulo: string = "";
    suscripcion: Subscription;
    botonEdicion: string = "";

    constructor(
        private moldesService: MoldesService,
        private ABMMoldesService: ABMMoldeService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) {
        this.suscripcion = this.ABMMoldesService.viewEvents.subscribe(
            (data: any) => {
                if (data == 0) {
                    this.botonEdicion = "Guardar Molde"
                } else if (data == 1) {
                    this.botonEdicion = "Guardar bocas"
                } else if (data == 2) {
                    this.botonEdicion = "Guardar dimensiones"
                }
            }
        )
    }

    ngOnInit(): void {
        this.botonEdicion = "Guardar Molde"
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges()
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    componentAdded(event) {
        if (event.component == "Grilla") {
            this.titulo = "Consulta Moldes"
        }
        if (event.component == "Molde") {
            if (this.moldesService.getMode() == "Edit") {
                this.titulo = "Edición Molde";
            }
            if (this.moldesService.getMode() == "View" || this.moldesService.getMode() == undefined) {
                this.titulo = "Vista Molde";
            }
        }
        if (event.component == "Create") {
            this.titulo = "Nuevo Molde"
        }
    }

    edit() {
        this.ABMMoldesService.events.next(2)
    }

    close() {
        this.ABMMoldesService.events.next(1)
    }

    create() {
        this.moldesService.setMode("Create")
        this.router.navigate(['../moldes/create']);
    }

    save() {
        this.ABMMoldesService.events.next(4)
    }
}