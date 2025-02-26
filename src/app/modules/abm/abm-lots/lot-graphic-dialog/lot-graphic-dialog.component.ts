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
        this.selectedFile = event.target.files[0];
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
                        this.snackBar.open('Gráfico cargado correctamente', 'Cerrar', {
                            duration: 3000,
                        });
                        this.dialogRef.close({ action: 'upload' });
                    },
                    error: (error) => {
                        console.error('Error al cargar el gráfico', error);
                        this.snackBar.open('Error al cargar el gráfico', 'Cerrar', {
                            duration: 3000,
                        });
                    }
                });
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
