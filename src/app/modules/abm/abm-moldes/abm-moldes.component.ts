import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
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
    moldeTitulo: string = null;

    constructor(
        private activatedRoute: ActivatedRoute,
        private moldesService: MoldesService,
        private ABMMoldesService: ABMMoldeService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) {
        this.suscripcion = this.ABMMoldesService.viewEvents.subscribe(
            (data: string) => {
                this.botonEdicion = data;
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
            this.titulo = "Consulta Moldes";
            this.moldeTitulo = null;
        }
        if (event.component == "Molde") {
            this.moldeTitulo = null;
            if (this.moldesService.getMode() == "Edit") {
                this.titulo = "Edición Molde";
            }
            if (this.moldesService.getMode() == "View" || this.moldesService.getMode() == undefined) {
                this.titulo = "Vista Molde";
            }
        }
        if (event.component == "Create") {
            this.moldeTitulo = null;
            this.titulo = "Nuevo Molde"
        }
        if(event.component == "Ingresos / Egresos") {
            this.titulo = "...";
            this.moldesService.getMoldeById(this.activatedRoute.snapshot.children[0].params['id']).subscribe(d => {
                this.moldeTitulo = "Ingresos / Egresos";
                this.titulo = d.data.nombre;
            });
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

    ingresoEgreso() {
        this.ABMMoldesService.events.next(5)
    }
}