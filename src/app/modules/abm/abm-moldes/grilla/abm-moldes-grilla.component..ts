import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
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
    moldesBackup: Array<Molde> = [];
    displayedColumns: string[] = ['code', 'name', 'status', 'acciones'];
    showSuccess: boolean = false;
    showError: boolean = false;
    panelOpenState: boolean = false;
    searchForm: FormGroup;

    constructor(
        private moldesService: MoldesService,
        private formBuilder: FormBuilder,
    ) {
        this.searchForm = this.formBuilder.group({
            code: [null],
            name: [null],
            status: [null],
            measurements: [null],
            min: [null],
            max: [null],
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

    openProfile(id: number) {
        switch (id) {
            case 1:
                //Editar
                this.moldesService.setMode("Edit");
                break;
            case 2:
                //Ver
                this.moldesService.setMode("View");
                break;
            case 3:
                //Ingresos / Egresos
                break;
        }
    }

    inicializar() {
        this.moldesService.getMoldes().subscribe(d=>{
            console.log(d.data)
            this.moldes = d.data;
            this.moldesBackup = this.moldes;
        })
    }

    search() {
        //Filtrar por estado
        let moldesSearch: Array<Molde>;
        if(this.searchForm.controls.status.value == "" || this.searchForm.controls.status.value == null ) {
            moldesSearch = this.moldesBackup;
        } else {
            moldesSearch = this.moldesBackup.filter(molde => molde.estado == this.searchForm.controls.status.value);
        };
        if(this.searchForm.controls.code.value != null && this.searchForm.controls.code.value != '') {
            //Filtrar por codigo
            moldesSearch = moldesSearch.filter(molde => molde.codigo.toLowerCase().includes(this.searchForm.controls.code.value.toLowerCase()));
        };
        if(this.searchForm.controls.name.value != null && this.searchForm.controls.name.value != '') {
            //Filtrar por nombre
            moldesSearch = moldesSearch.filter(molde => molde.nombre.toLowerCase().includes(this.searchForm.controls.name.value.toLowerCase()));
        };
        if(this.searchForm.controls.measurements != null) {
            //Filtrar por medidas
            if(this.searchForm.controls.min.value != null && this.searchForm.controls.min.value != "" && this.searchForm.controls.max.value != null && this.searchForm.controls.max.value != "" ) {
                //Filtrar por min y max
            } else if (this.searchForm.controls.min.value != null && this.searchForm.controls.min.value != "") {
                //Filtrar por min
            } else if (this.searchForm.controls.max.value != null && this.searchForm.controls.max.value != "") {
                //Filtrar por max
            }
        };
        this.moldes = moldesSearch;
    }
}