import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Molde } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";
import { Subscription } from "rxjs";
import { ABMMoldeService } from "../abm-moldes-service";

@Component({
    selector: 'abm-moldes-crear',
    templateUrl: './abm-moldes-crear.component.html'
})

export class ABMMoldesCrear implements OnInit, OnDestroy{
    component: string = "Create";
    suscripcion: Subscription;
    moldeForm: FormGroup;

    constructor(
        private activatedRoute: ActivatedRoute,
        public dialog: MatDialog,
        private router: Router,
        private moldesService: MoldesService,
        private _formBuilder: FormBuilder,
        private ABMoldesService: ABMMoldeService
    ){
        this.moldeForm = this._formBuilder.group({
            code: [null, [Validators.required, Validators.maxLength(30)]],
            status: [true, [Validators.required]],
            name: [null, [Validators.required, Validators.maxLength(100)]],
            observations: [null],
            location: [null]
        });
        this.suscripcion = this.ABMoldesService.events.subscribe(
            (data: any) => {
                if (data == 1) {
                    this.close();
                } else if (data == 4) {
                    this.create();
                }
            }
        )
    }

    ngOnInit(): void {
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

    close() {
        if (this.moldeForm.pristine == true) {
            this.router.navigate(['/moldes/grid'])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: "molde", boton: "Cerrar" },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate(['/moldes/grid']);
                }
            });
        }
    }

    create() {
        if(this.moldeForm.invalid) {
            return;
        }
        let model: Molde = {
            codigo: this.moldeForm.controls.code.value,
            estado: this.moldeForm.controls.status.value,
            nombre: this.moldeForm.controls.name.value,
            observaciones: this.moldeForm.controls.observations.value,
            ubicacion: this.moldeForm.controls.location.value,
            id: 0
        }
        this.moldesService.postMolde(model).subscribe(res=>{
            if(res.status == 'OK') {
                this.moldesService.setMode("Edit");
                this.router.navigate([`/moldes/molde/${res.data.id}`]);
            }
        })
    }
}