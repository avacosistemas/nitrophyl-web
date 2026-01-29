import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { LotService } from 'app/shared/services/lot.service';
import { ILotObservation } from 'app/shared/models/lot.interface';

@Component({
    selector: 'app-lot-comments',
    templateUrl: './lot-comments.component.html',
})
export class LotCommentsComponent implements OnInit {
    form: FormGroup;
    dataSource = new MatTableDataSource<ILotObservation>([]);
    displayedColumns: string[] = ['fecha', 'usuario', 'observacion', 'check'];
    loading: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<LotCommentsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { lotId: number, nroLote: string },
        private fb: FormBuilder,
        private lotService: LotService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadComments();
    }

    private initForm(): void {
        this.form = this.fb.group({
            observaciones: ['', Validators.required],
            mostrarReporte: [false]
        });
    }

    loadComments(): void {
        this.loading = true;
        this.lotService.getObservaciones(this.data.lotId).subscribe({
            next: (response) => {
                if (response.data) {
                    const sortedData = response.data.sort((a, b) =>
                        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
                    );
                    this.dataSource.data = sortedData;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading comments', err);
                this.openSnackBar(false, 'Error al cargar los comentarios');
                this.loading = false;
            }
        });
    }

    addComment(): void {
        if (this.form.invalid) return;

        this.loading = true;
        const payload: Partial<ILotObservation> = {
            idLote: this.data.lotId,
            observaciones: this.form.get('observaciones').value,
            mostrarReporte: this.form.get('mostrarReporte').value,
            id: 0
        };

        this.lotService.createObservacion(payload).subscribe({
            next: (res) => {
                this.openSnackBar(true, 'Comentario agregado correctamente');
                this.form.reset({ observaciones: '', mostrarReporte: false });
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.loadComments();
            },
            error: (err) => {
                console.error('Error adding comment', err);
                this.openSnackBar(false, 'Error al agregar el comentario');
                this.loading = false;
            }
        });
    }

    toggleCheck(element: ILotObservation): void {
        this.loading = true;
        this.lotService.toggleObservacionCheck(element.id).subscribe({
            next: () => {
                this.openSnackBar(true, 'Visibilidad en reporte actualizada');
                this.loading = false;
            },
            error: (err) => {
                console.error('Error toggling check', err);
                this.openSnackBar(false, 'Error al actualizar');
                element.mostrarReporte = !element.mostrarReporte;
                this.loading = false;
            }
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    private openSnackBar(success: boolean, message: string): void {
        this.snackBar.open(message, 'X', {
            duration: 3000,
            panelClass: success ? 'green-snackbar' : 'red-snackbar',
        });
    }
}