import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Boca, Dimension } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";
import { Subscription } from "rxjs";
import { ABMMoldeService } from "../abm-moldes-service";

@Component({
    selector: 'abm-moldes-molde',
    templateUrl: './abm-moldes-molde.component.html'
})

export class ABMMoldesMolde implements OnInit, OnDestroy{
    component: string = "Molde";
    mode: string;
    showSuccess: boolean = false;
    showError: boolean = false;
    suscripcion: Subscription;
    moldeForm: FormGroup;
    bocaForm: FormGroup;
    dimensionForm: FormGroup;
    displayedColumnsBocas: string[] = ['boca', 'estado', 'acciones'];
    displayedColumnsDimensiones: string[] = ['dimension', 'valor', 'acciones'];
    bocas: Array<Boca> =  [];
    dimensiones: Array<Dimension> = [];
    estados = ['Activa', 'Inactiva'];
    dimensionesSelect = ['ALTO', 'ANCHO', 'PROFUNDIDAD', 'DIAMETRO'];
    currentTab: number = 0;
    pristineBocas: boolean = true;
    pristineDimensiones: boolean = true;
    currentId: number;

    constructor(
        private activatedRoute: ActivatedRoute,
        public dialog: MatDialog,
        private router: Router,
        private moldesService: MoldesService,
        private _formBuilder: FormBuilder,
        private ABMoldesService: ABMMoldeService
    ){
        this.moldeForm = this._formBuilder.group({
            codigo: [null, [Validators.required, Validators.maxLength(30)]],
            estado: [null, [Validators.required]],
            nombre: [null, [Validators.required, Validators.maxLength(100)]],
            observaciones: [null],
            ubicacion: [null]
        });
        this.bocaForm = this._formBuilder.group({
            boca: [null, [Validators.required]],
            estado: [null, [Validators.required]],
        });
        this.dimensionForm = this._formBuilder.group({
            dimension: [null, [Validators.required]],
            valor: [null, [Validators.required]],
        });
        this.suscripcion = this.ABMoldesService.events.subscribe(
            (data: any) => {
                if (data == 1) {
                    this.close();
                } else if (data == 2) {
                    this.edit();
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

    tabChange(event) {
        this.showSuccess = false;
        this.showError = false;
        this.currentTab = event.index;
        //0 - Datos del Molde
        if(event.index == 0) {
            this.ABMoldesService.viewEvents.next(0);
        }
        //1 - Bocas
        if(event.index == 1) {
            this.ABMoldesService.viewEvents.next(1);
        }
        //2 - Dimensiones
        if(event.index == 2) {
            this.ABMoldesService.viewEvents.next(2);
        }
    }

    close() {
        if (this.moldeForm.pristine == true && this.pristineBocas && this.pristineDimensiones) {
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

    edit() {
        if (this.currentTab == 0) {
            this.editMolde();
        }
        if (this.currentTab == 1) {
            this.editBocas();
        }
        if (this.currentTab == 2) {
            this.editDimensiones();
        }
    }

    editMolde() {
        if(this.moldeForm.invalid) {
            return;
        }
        let model = this.moldeForm.value;
        this.moldesService.updateMolde(this.currentId, model).subscribe(res => {
            if(res.status == "OK") {
                this.showSuccess = true;
                this.moldeForm.markAsPristine();
            } else {
                this.showError = true;
            }
        })
    }

    editBocas() {
        this.showError = false;
        this.showSuccess = false;
        let model: Array<Boca> = [];
        this.bocas.forEach(boca => {
            model.push({
                estado: boca.estado,
                nroBoca: Number(boca.nroBoca)
            })
        })
        this.moldesService.updateMoldeBocas(this.currentId, model).subscribe(res => {
            if(res.status == "OK") {
                this.showSuccess = true;
                this.pristineBocas = true;
            } else {
                this.showError = true;
            }
        })
    }

    editDimensiones() {
        this.showError = false;
        this.showSuccess = false;
        let model: Array<Dimension> = [];
        this.dimensiones.forEach(dimension => {
            model.push({
                tipoDimension: dimension.tipoDimension,
                valor: dimension.valor
            })
        })
        this.moldesService.updateMoldeDimensiones(this.currentId, model).subscribe(res => {
            if(res.status == "OK") {
                this.showSuccess = true;
                this.pristineDimensiones = true;
            } else {
                this.showError = true;
            }
        })
    }

    inicializar() {
        this.mode = this.moldesService.getMode();
        if(this.mode == undefined || this.mode == "View") {
            this.mode = "View";
            this.moldeForm.disable();
        }
        this.currentId = this.activatedRoute.snapshot.params['id'];
        this.moldesService.getMoldeById(this.currentId).subscribe(d => {
            this.moldeForm.patchValue({
                codigo: d.data.codigo,
                estado: d.data.estado,
                nombre: d.data.nombre,
                observaciones: d.data.observaciones,
                ubicacion: d.data.ubicacion
            })
        });
        this.moldesService.getMoldeBocas(this.currentId).subscribe(d => {
            this.bocas = d.data;
        });
        this.moldesService.getMoldeDimensiones(this.currentId).subscribe(d => {
            this.dimensiones = d.data;
        })
    }
    
    addBoca() {
        if(this.bocaForm.invalid) {
            return;
        };
        this.pristineBocas = false;
        let item: Boca = {
            nroBoca: this.bocaForm.controls.boca.value,
            estado: this.bocaForm.controls.estado.value == "Activa"
        }
        this.bocas.push(item);
        this.bocas = [...this.bocas];
        this.bocaForm.reset()
    }

    addDimension() {
        if(this.dimensionForm.invalid) {
            return;
        };
        this.pristineDimensiones = false;
        let item: Dimension = {
            tipoDimension: this.dimensionForm.controls.dimension.value,
            valor: Number(this.dimensionForm.controls.valor.value)
        }
        this.dimensiones.push(item);
        this.dimensiones = [...this.dimensiones];
        this.dimensionForm.reset()
    }

    deleteBoca(row) {
        this.pristineBocas = false;
        this.bocas.splice(this.bocas.indexOf(row), 1);
        this.bocas = [...this.bocas]
    }

    deleteDimension(row) {
        this.pristineDimensiones = false;
        this.dimensiones.splice(this.dimensiones.indexOf(row), 1);
        this.dimensiones = [...this.dimensiones]
    }
}