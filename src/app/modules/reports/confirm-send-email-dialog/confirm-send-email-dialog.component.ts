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
    selectedFile: File | null = null;
    formSubmitted: boolean = false;
    email: string;

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
    }

    ngOnInit(): void {
        this.buildForm();
    }

    private buildForm(): void {
        this.graphicForm = this.formBuilder.group({
            archivo: [null],
            nombreArchivo: [''],
            observaciones: ['']
        });
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file && file.type === 'application/pdf') {
            this.selectedFile = file;
            const fileNameWithoutExtension = file.name.replace(/\.pdf$/i, '');
            this.graphicForm.patchValue({ nombreArchivo: fileNameWithoutExtension });
            this.graphicForm.updateValueAndValidity();
            this.cdRef.detectChanges();
        } else {
            this.selectedFile = null;
            this.openSnackBar(false, 'Por favor, seleccione un archivo PDF.');

            const input = event.target as HTMLInputElement;
            input.value = '';
            this.graphicForm.updateValueAndValidity();
            this.cdRef.detectChanges();
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onEnviarInforme(): void {
        this.formSubmitted = true;

        const idCliente = this.data.idCliente;
        const idLote = this.data.idLote;
        const nombreArchivo = this.graphicForm.get('nombreArchivo').value;
        const observaciones = this.graphicForm.get('observaciones').value;
        const observacionesInforme = this.data.observacionesInforme;
        let base64Content: string | null = null;

        if (this.selectedFile) {
            const reader = new FileReader();
            reader.onload = () => {
                base64Content = (reader.result as string).split(',')[1];
                this.sendEmail(idCliente, idLote, base64Content, nombreArchivo, observaciones, observacionesInforme);
            };
            reader.readAsDataURL(this.selectedFile);
        } else {
            this.sendEmail(idCliente, idLote, base64Content, nombreArchivo, observaciones, observacionesInforme);
        }
    }

    sendEmail(idCliente: number, idLote: string, archivo: string | null, nombreArchivo: string, observaciones: string, observacionesInforme: string): void {
        this.lotService.enviarInformePorCorreo(idCliente, idLote, archivo, nombreArchivo, observaciones, observacionesInforme).subscribe({
            next: (response: any) => {
                if (response && response.status === 'ERROR') {
                    this.openSnackBar(false, response.message || 'Error al enviar el informe');
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

    removeSelectedFile(): void {
        this.selectedFile = null;
        this.graphicForm.patchValue({
            nombreArchivo: '',
            archivo: null
        });

        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
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