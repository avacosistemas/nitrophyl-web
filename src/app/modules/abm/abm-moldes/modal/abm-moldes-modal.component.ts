import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CargaArchivo } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";

@Component({
    selector: 'abm-moldes-modal',
    templateUrl: 'abm-moldes-modal.component.html',
    styleUrls: ['./abm-moldes-modal.component.scss']
})

export class ABMMoldesModalComponent implements OnInit{

    tipo: string = "";
    description: string = "";
    file: CargaArchivo;
    uploading: boolean = false;

    constructor(
        private snackBar: MatSnackBar,
        private moldesService: MoldesService,
        public dialogRef: MatDialogRef<ABMMoldesModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
    ){}

    ngOnInit(): void {
        console.log(this.file)
        this.tipo = this.data.archivo;
    }

    elegirArchivo() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = _ => {
            let files = Array.from(input.files);
            console.log(files); //File Array
            console.log(input.files); //FileList
            function changeFile(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            };
            changeFile(files[0]).then((base64: string): any => {
                this.file = {
                    idMolde: Number(this.data.id),
                    nombreArchivo: files[0].name,
                    archivo: base64.split(',')[1],
                    descripcion: ""
                };
            });
        };
        input.click();
    }

    subir() {
        this.uploading = true;
        this.file.descripcion = this.description;
        if (this.tipo == "pdf") {
            this.moldesService.postPlano(this.file).subscribe(d => {
                console.log(d);
                this.openSnackBar("Plano subido", "X", "green-snackbar");
                this.save();
            })
        } else {
            this.moldesService.postFoto(this.file).subscribe(d => {
                console.log(d);
                this.openSnackBar("Foto subida", "X", "green-snackbar");
                this.save();
            })
        }
    }

    save() {
        this.dialogRef.close(true)
    }

    close() {
        this.dialogRef.close(false)
    }

    openSnackBar(message: string, action: string, className: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: className
        });
    };
}