import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { ImgModalDialogComponent } from "app/modules/prompts/img-modal/img-modal.component";
import { PDFModalDialogComponent } from "app/modules/prompts/pdf-modal/pdf-modal.component";
import { RemoveDialogComponent } from "app/modules/prompts/remove/remove.component";
import { Boca, CargaArchivo, Dimension, Fotos, Planos } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";
import { Subscription } from "rxjs";
import { ABMMoldeService } from "../abm-moldes-service";
import * as FileSaver from "file-saver";
import { ABMMoldesModalComponent } from "../modal/abm-moldes-modal.component";

@Component({
    selector: 'abm-moldes-molde',
    templateUrl: './abm-moldes-molde.component.html',
    styleUrls: ['./abm-moldes-molde.component.scss']
})

export class ABMMoldesMolde implements OnInit, OnDestroy{
    component: string = "Molde";
    mode: string;
    suscripcion: Subscription;
    moldeForm: FormGroup;
    bocaForm: FormGroup;
    dimensionForm: FormGroup;
    displayedColumnsBocas: string[] = ['boca', 'estado', 'descripcion', 'acciones'];
    displayedColumnsDimensiones: string[] = ['dimension', 'valor', 'acciones'];
    displayedColumnsPlanos: string[] = ['nombre', 'descripcion', 'version', 'fecha', 'acciones'];
    displayedColumnsFotos: string[] = ['nombre', 'descripcion', 'version', 'fecha', 'acciones'];
    planos: Array<Planos> = [];
    fotos: Array<Fotos> = [];
    bocas: Array<Boca> =  [];
    dimensiones: Array<Dimension> = [];
    estados = ['Activa', 'Inactiva', 'En Reparación'];
    dimensionesSelect = ['ALTO', 'ANCHO', 'PROFUNDIDAD', 'DIAMETRO'];
    currentTab: number = 0;
    pristineBocas: boolean = true;
    pristineDimensiones: boolean = true;
    currentId: number;

    filesTestPlano;
    filesTestPlanoBlob;
    filesTestFoto;

    bocaGridForm: FormGroup = new FormGroup({});

    constructor(
        private activatedRoute: ActivatedRoute,
        public dialog: MatDialog,
        private router: Router,
        private moldesService: MoldesService,
        private _formBuilder: FormBuilder,
        private ABMoldesService: ABMMoldeService,
        private snackBar: MatSnackBar
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
            descripcion: [null, [Validators.maxLength(100)]],
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

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
          top.scrollIntoView();
          top = null;
        }
    }

    tabChange(event) {
        this.currentTab = event.index;
        switch (event.index) {
            case 0:
                //0 - Datos del Molde
                this.ABMoldesService.viewEvents.next("Guardar Molde");
                break;
            case 1:
                //1 - Bocas
                this.ABMoldesService.viewEvents.next("Guardar Bocas");
                break;
            case 2:
                //2 - Dimensiones
                this.ABMoldesService.viewEvents.next("Guardar Dimensiones");
                break;
            case 3:
                //3 - Planos
                this.ABMoldesService.viewEvents.next("Subir Plano");
                break;
            case 4:
                //4 - Fotos
                this.ABMoldesService.viewEvents.next("Subir Foto");
                break;
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
        switch (this.currentTab) {
            case 0:
                this.editMolde();
                break;
            case 1:
                this.editBocas();
                break;
            case 2:
                this.editDimensiones();
                break;
            case 3:
                this.uploadPlano();
                break;
            case 4:
                this.uploadFoto();
                break;
        }
    }

    editMolde() {
        if(this.moldeForm.invalid) {
            return;
        }
        let model = this.moldeForm.value;
        this.moldesService.updateMolde(this.currentId, model).subscribe(res => {
            if(res.status == "OK") {
                this.moldeForm.markAsPristine();
                this.openSnackBar("Cambios realizados", "X", "green-snackbar");
            } else {
                this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
            }
        })
    }

    editBocas() {
        let model: Array<Boca> = [];
        this.bocas.forEach(boca => {
            model.push({
                estado: boca.estado,
                nroBoca: Number(boca.nroBoca),
                descripcion: this.bocaGridForm.get(`control-${boca.nroBoca}-${boca.descripcion}`).value
            })
        })
        this.moldesService.updateMoldeBocas(this.currentId, model).subscribe(res => {
            if(res.status == "OK") {
                this.pristineBocas = true;
                this.openSnackBar("Cambios realizados", "X", "green-snackbar");
            } else {
                this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
            }
        })
    }

    editDimensiones() {
        let model: Array<Dimension> = [];
        this.dimensiones.forEach(dimension => {
            model.push({
                tipoDimension: dimension.tipoDimension,
                valor: dimension.valor
            })
        })
        this.moldesService.updateMoldeDimensiones(this.currentId, model).subscribe(res => {
            if(res.status == "OK") {
                this.pristineDimensiones = true;
                this.openSnackBar("Cambios realizados", "X", "green-snackbar");
            } else {
                this.openSnackBar("No se puedieron realizar los cambios", "X", "red-snackbar");
            }
        })
    }

    inicializar() {
        this.mode = this.moldesService.getMode();
        if(this.mode == undefined || this.mode == "View") {
            this.mode = "View";
            this.moldeForm.disable();
            this.bocaGridForm.disable();
        };
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
            console.log(d.data)
            this.bocas = d.data;
            if(this.bocas.length > 0) {
                this.bocas.forEach(b => {
                    this.bocaGridForm.addControl(`control-${b.nroBoca}-${b.descripcion}`, new FormControl(b.descripcion, Validators.maxLength(100)));
                });
                if(this.mode == "View") {
                    this.bocaGridForm.disable();
                };
            }
        });
        this.moldesService.getMoldeDimensiones(this.currentId).subscribe(d => {
            this.dimensiones = d.data;
        });
        this.moldesService.getPlanos(this.currentId).subscribe(d => {
            this.planos = d.data;
        });
        this.moldesService.getFotos(this.currentId).subscribe(d => {
            this.fotos = d.data;
        })
        this.ABMoldesService.viewEvents.next("Guardar Molde");
    }
    
    addBoca() {
        if(this.bocaForm.invalid) {
            return;
        };
        this.pristineBocas = false;
        let item: Boca = {
            nroBoca: this.bocaForm.controls.boca.value,
            estado: this.bocaForm.controls.estado.value,
            descripcion: this.bocaForm.controls.descripcion.value
        };
        this.bocaGridForm.addControl(`control-${item.nroBoca}-${item.descripcion}`, new FormControl(item.descripcion, Validators.maxLength(100)));
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
        console.log(row);
        this.pristineBocas = false;
        this.bocas.splice(this.bocas.indexOf(row), 1);
        this.bocas = [...this.bocas];
        this.bocaGridForm.removeControl(`control-${row.nroBoca}-${row.descripcion}`);
    }

    deleteDimension(row) {
        this.pristineDimensiones = false;
        this.dimensiones.splice(this.dimensiones.indexOf(row), 1);
        this.dimensiones = [...this.dimensiones]
    }

    openPlano(row) {
        console.log(row);
        let name = row.nombreArchivo.split('.');
        this.moldesService.downloadPlano(row.id).subscribe(d => {
            if (name[name.length - 1] == "pdf") {
                const dialogRef = this.dialog.open(PDFModalDialogComponent, {
                    maxWidth: '75%',
                    data: { src: d.data.archivo, title: d.data.nombreArchivo }
                });
                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        console.log(result);
                    }
                });
            } else {
                const dialogRef = this.dialog.open(ImgModalDialogComponent, {
                    maxWidth: '75%',
                    data: { src: d.data.archivo, imgType: "array", imgAlt: "imagen", title: d.data.nombreArchivo, imgExtension: name[name.length - 1] }
                });
                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        console.log(result);
                    }
                });
            }
        })
    }

    downloadPlano(row) {
        console.log(row);
        let name = row.nombreArchivo.split('.');
        this.moldesService.downloadPlano(row.id).subscribe(d => {
            if(name[name.length - 1] == "pdf") {
                let url = 'data:application/pdf;base64,' + d.data.archivo;
                var byteString = atob(url.split(',')[1]);
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);

                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                FileSaver.saveAs(new Blob([ab], { type: 'application/pdf' }), row.nombreArchivo)
            } else {
                let url = 'data:image/' + name[name.length - 1] + ';base64,' + d.data.archivo;
                var byteString = atob(url.split(',')[1]);
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);

                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                FileSaver.saveAs(new Blob([ab], { type: 'image/' + name[name.length - 1] }), row.nombreArchivo)
            }
        })
    }

    openFoto(row) {
        console.log(row);
        this.moldesService.downloadFoto(row.id).subscribe(d => {
            let name = d.data.nombreArchivo.split('.');
            const dialogRef = this.dialog.open(ImgModalDialogComponent, {
                maxWidth: '75%',
                data: { src: d.data.archivo, imgType: "array", imgAlt: "imagen", title: d.data.nombreArchivo, imgExtension: name[name.length - 1]}
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    console.log(result);
                }
            });
        })
    }

    downloadFoto(row) {
        let name = row.nombreArchivo.split('.');
        this.moldesService.downloadFoto(row.id).subscribe(d => {
            let url = 'data:image/' + name[name.length - 1] + ';base64,' + d.data.archivo;
            var byteString = atob(url.split(',')[1]);
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);

            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            FileSaver.saveAs(new Blob([ab], { type: 'image/' + name[name.length - 1] }), row.nombreArchivo)
        })
    }

    uploadPlano() {
        const dialogRef = this.dialog.open(ABMMoldesModalComponent, {
            maxWidth: '70%',
            width: '50%',
            data: { data: null, seccion: "molde", boton: "Cerrar", archivo: "pdf", id: this.currentId},
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.moldesService.getPlanos(this.currentId).subscribe(d => {
                    this.planos = d.data;
                });
            }
        });
    }

    uploadFoto() {
        const dialogRef = this.dialog.open(ABMMoldesModalComponent, {
            maxWidth: '70%',
            width: '50%',
            data: { data: null, seccion: "molde", boton: "Cerrar", archivo: "imagen", id: this.currentId },
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.moldesService.getFotos(this.currentId).subscribe(d => {
                    this.fotos = d.data;
                });
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