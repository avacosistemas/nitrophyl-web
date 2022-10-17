import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
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
    displayedColumnsPlanos: string[] = ['nombre', 'version', 'fecha', 'acciones'];
    displayedColumnsFotos: string[] = ['nombre', 'version', 'fecha', 'acciones'];
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
                descripcion: boca.descripcion
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
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = _ => {
            let files = Array.from(input.files);
            console.log(files); //File Array
            console.log(input.files); //FileList
            this.filesTestPlanoBlob = files[0];
            //POST del plano
            //GET a lista de planos
            function changeFile(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            };
            changeFile(files[0]).then((base64: string): any => {
                this.filesTestPlano = base64;
                let model: CargaArchivo = {
                    idMolde: Number(this.currentId),
                    nombreArchivo: files[0].name,
                    archivo: base64.split(',')[1]
                };
                this.moldesService.postPlano(model).subscribe(d => {
                    console.log(d);
                    this.moldesService.getPlanos(this.currentId).subscribe(d => {
                        this.planos = d.data;
                    });
                })
            });
        };
        input.click();
    }

    uploadFoto() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = _ => {
            let files = Array.from(input.files);
            console.log(files); //File Array
            console.log(input.files); //FileList
            //POST del Foto
            //GET a lista de Fotos
            this.filesTestFoto = files[0];
            function changeFile(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            };
            changeFile(files[0]).then((base64: string): any => {
                let model: CargaArchivo = {
                    idMolde: Number(this.currentId),
                    nombreArchivo: files[0].name,
                    archivo: base64.split(',')[1]
                };
                this.moldesService.postFoto(model).subscribe(d => {
                    console.log(d);
                    this.moldesService.getFotos(this.currentId).subscribe(d => {
                        this.fotos = d.data;
                    })
                })
            });
        };
        input.click();
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}