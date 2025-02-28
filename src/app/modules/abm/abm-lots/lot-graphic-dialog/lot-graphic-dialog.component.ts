import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LotService } from 'app/shared/services/lot.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-lot-graphic-dialog',
    templateUrl: './lot-graphic-dialog.component.html'
})
export class LotGraphicDialogComponent {
    selectedFile: File | null = null;
    lotId: number;
    lotNroLote: string;

    constructor(
        public dialogRef: MatDialogRef<LotGraphicDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { lotId: number; lotNroLote: string },
        private lotService: LotService,
        private snackBar: MatSnackBar
    ) {
        this.lotId = data.lotId;
        this.lotNroLote = data.lotNroLote;
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file && file.type === 'application/pdf') {
            this.selectedFile = file;
        } else {
            this.selectedFile = null;
            this.openSnackBar(false, 'Por favor, seleccione un archivo PDF.');

            const input = event.target as HTMLInputElement;
            input.value = '';
        }
    }

    uploadFile(): void {
        if (this.selectedFile) {
            const reader = new FileReader();
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            reader.onload = () => {
                const base64String = reader.result as string;
                const base64Content = base64String.split(',')[1];

                this.lotService.uploadGrafico(this.lotId, base64Content).subscribe({
                    next: (response) => {
                        this.openSnackBar(true, 'Gráfico cargado correctamente');
                        this.dialogRef.close({ action: 'upload' });
                    },
                    error: (error) => {
                        console.error('Error al cargar el gráfico', error);
                        this.openSnackBar(false, 'Error al cargar el gráfico');
                    }
                });
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
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
