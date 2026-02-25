import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LotService } from 'app/shared/services/lot.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ClientesService } from 'app/shared/services/clientes.service';

@Component({
    selector: 'app-confirm-send-email-dialog',
    templateUrl: './confirm-send-email-dialog.component.html',
})
export class ConfirmSendEmailDialogComponent implements OnInit {
    graphicForm: FormGroup;
    selectedFiles: File[] = [];
    formSubmitted: boolean = false;
    email: string;
    isMultiple: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<ConfirmSendEmailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            observacionesInforme: string; idCliente: number; idLote: string; email: string
        },
        private lotService: LotService,
        private snackBar: MatSnackBar,
        private formBuilder: FormBuilder,
        private cdRef: ChangeDetectorRef,
        private clientsService: ClientesService
    ) {
        this.email = data.email;
        this.isMultiple = data.idLote.includes(',');
    }

    ngOnInit(): void {
        this.buildForm();
    }

    private buildForm(): void {
        this.graphicForm = this.formBuilder.group({
            observaciones: ['']
        });
    }

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file && file.type === 'application/pdf') {
                this.selectedFiles.push(file);
            } else {
                this.openSnackBar(false, `El archivo "${file.name}" no es un PDF válido.`);
            }
        }

        const input = event.target as HTMLInputElement;
        input.value = '';
        this.graphicForm.updateValueAndValidity();
        this.cdRef.detectChanges();
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    async onEnviarInforme(): Promise<void> {
        this.formSubmitted = true;

        const idCliente = this.data.idCliente;
        const idLote = this.data.idLote;
        const observaciones = this.graphicForm.get('observaciones').value;
        const observacionesInforme = this.data.observacionesInforme;
        const archivosPayload: any[] = [];

        try {
            for (const file of this.selectedFiles) {
                const base64 = await this.fileToBase64(file);
                archivosPayload.push({
                    nombre: file.name,
                    base64: base64
                });
            }

            this.sendEmail(idCliente, idLote, archivosPayload, observaciones, observacionesInforme);
        } catch (error) {
            console.error('Error procesando archivos', error);
            this.openSnackBar(false, 'Error al procesar los archivos adjuntos');
        }
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }


    sendEmail(idCliente: number, idLote: string, archivos: any[], observaciones: string, observacionesInforme: string): void {
        this.lotService.enviarInformePorCorreo(idCliente, idLote, archivos, observaciones, observacionesInforme).subscribe({
            next: (response: any) => {
                if (response && response.status === 'ERROR') {
                    this.openSnackBar(false, response.error || 'Error al enviar el informe');
                } else {
                    this.openSnackBar(true, 'Informe enviado correctamente', 'green');
                    this.dialogRef.close({ result: 'success' });
                }
            },
            error: (error) => {
                console.error('Error al enviar el informe', error);
                this.openSnackBar(false, 'Error al enviar el informe', 'red');
            }
        });
    }

    removeSelectedFile(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.graphicForm.updateValueAndValidity();
        this.cdRef.detectChanges();
    }

    private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
        const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
        const defaultCss: string = option ? 'green' : 'red';
        const snackBarMessage = message ? message : defaultMessage;
        const snackBarCss = css ? css : defaultCss;
        const snackBarDuration = duration ? duration : 5000;

        this.snackBar.open(snackBarMessage, 'X', {
            duration: snackBarDuration,
            panelClass: `${snackBarCss}-snackbar`,
        });
    }
}