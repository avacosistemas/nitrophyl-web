import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Molde } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";


@Component({
    selector: 'abm-moldes-grilla',
    templateUrl: './abm-moldes-grilla.component.html'
})

export class ABMMoldesGrillaComponent implements OnInit {
    component = "Grilla";
    moldes: Array<Molde> = [];
    displayedColumns: string[] = ['code', 'name', 'status', 'acciones'];
    showSuccess = false;
    showError = false;

    constructor(
        private moldesService: MoldesService
    ) { }

    ngOnInit(): void {
        this.inicializar()
    }

    openProfile(id: number) {
        if (id == 1) {
            //Editar
            this.moldesService.setMode("Edit")
        } else {
            //Ver
            this.moldesService.setMode("View")
        }
    }

    inicializar() {
        this.moldesService.getMoldes().subscribe(d=>this.moldes = d.data)
    }
}