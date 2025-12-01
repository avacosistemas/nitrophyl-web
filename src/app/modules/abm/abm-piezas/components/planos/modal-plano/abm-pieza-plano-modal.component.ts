import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ABMPiezaService } from '../../../abm-piezas.service';

@Component({
    selector: 'app-abm-pieza-plano-modal',
    templateUrl: './abm-pieza-plano-modal.component.html',
    styleUrls: ['./abm-pieza-plano-modal.component.scss']
})
export class ABMPiezaPlanoModalComponent implements OnInit {
    uploadForm: FormGroup;
    selectedFile: File | null = null;
    uploading: boolean = false;
    title: string;
    private piezaId: number;

    buttonText: string = 'Subir';

    constructor(
        private notificationService: NotificationService,
        public dialogRef: MatDialogRef<ABMPiezaPlanoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private formBuilder: FormBuilder,
        private cdRef: ChangeDetectorRef,
        private abmPiezaService: ABMPiezaService
    ) { }

    ngOnInit(): void {
        this.title = this.data.title || 'Subir Plano';
        this.piezaId = this.data.piezaId;

        this.uploadForm = this.formBuilder.group({
            archivo: [null, Validators.required],
            codigo: ['', Validators.required],
            revision: [null, [Validators.required, Validators.pattern(/^([0-9]+|[a-zA-Z]+)$/)]],
            clasificacion: ['NITROPHYL', Validators.required],
            observaciones: [''],
        });
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.uploadForm.patchValue({ archivo: file });
            this.cdRef.detectChanges();
        }
    }

    removeSelectedFile(): void {
        this.selectedFile = null;
        this.uploadForm.patchValue({ archivo: null });
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
        this.cdRef.detectChanges();
    }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    subir(): void {
        if (this.uploadForm.invalid) {
            this.notificationService.showError("Por favor, complete todos los campos obligatorios.");
            return;
        }

        this.uploading = true;
        this.buttonText = 'Procesando...';
        this.cdRef.detectChanges();

        const reader = new FileReader();
        reader.onload = () => {
            const base64Content = (reader.result as string).split(',')[1];
            const formValue = this.uploadForm.value;

            const dto = {
                archivo: base64Content,
                clasificacion: formValue.clasificacion,
                codigo: formValue.codigo,
                idPieza: this.piezaId,
                observaciones: formValue.observaciones,
                revision: formValue.revision
            };

            this.abmPiezaService.uploadPlano(dto).subscribe({
                next: () => {
                    this.notificationService.showSuccess("Archivo subido correctamente");
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    console.error('Error al subir el archivo', error);
                    this.notificationService.showError("Error al subir el archivo");
                    this.resetUpload();
                }
            });
        };
        reader.readAsDataURL(this.selectedFile);
    }

    private resetUpload(): void {
        this.uploading = false;
        this.buttonText = 'Subir';
        this.cdRef.detectChanges();
    }
}