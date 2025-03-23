
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CargaArchivo } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";

@Component({
  selector: 'abm-moldes-modal',
  templateUrl: 'abm-moldes-modal.component.html',
  styleUrls: ['./abm-moldes-modal.component.scss']
})
export class ABMMoldesModalComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  formSubmitted: boolean = false;
  tipo: string = "";
  description: string = "";
  uploading: boolean = false;
  clasificacionOptions = [
    { value: 'NITROPHYL', label: 'Nitrophyl' },
    { value: 'CLIENTE', label: 'Cliente' }
  ];
  buttonText: string = 'Subir';
  fileExtension: string = '';

  constructor(
    private snackBar: MatSnackBar,
    private moldesService: MoldesService,
    public dialogRef: MatDialogRef<ABMMoldesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number, archivo: string },
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.tipo = this.data.archivo;
    this.buildForm();
  }

  private buildForm(): void {
    this.uploadForm = this.formBuilder.group({
      archivo: [null],
      nombreArchivo: [''],
      descripcion: [''],
      clasificacion: ['', this.tipo === 'pdf' ? Validators.required : []],
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      this.selectedFile = file;

      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      this.fileExtension = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex);
      const baseName = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);

      this.uploadForm.patchValue({
        nombreArchivo: baseName
      });


      this.uploadForm.updateValueAndValidity();
      this.cdRef.detectChanges();
    } else {
      this.selectedFile = null;
      this.openSnackBar("No se ha seleccionado ningún archivo.", "X", "red-snackbar");

      const input = event.target as HTMLInputElement;
      input.value = '';
      this.uploadForm.patchValue({
        nombreArchivo: ''
      });
      this.uploadForm.updateValueAndValidity();
      this.cdRef.detectChanges();
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.uploadForm.patchValue({
      archivo: null,
      nombreArchivo: ''
    });

    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.uploadForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  subir(): void {
    if (!this.selectedFile) {
      this.openSnackBar("Por favor, seleccione un archivo.", "X", "red-snackbar");
      return;
    }

    if (this.tipo === 'pdf' && !this.uploadForm.get('clasificacion').value) {
      this.openSnackBar("Por favor, seleccione una clasificación.", "X", "red-snackbar");
      return;
    }

    this.uploading = true;
    this.buttonText = 'Procesando...';
    this.cdRef.detectChanges();

    const nombreArchivo = this.uploadForm.get('nombreArchivo').value + this.fileExtension;
    const descripcion = this.uploadForm.get('descripcion').value;
    const clasificacion = this.uploadForm.get('clasificacion').value;

    let base64Content: string | null = null;

    const reader = new FileReader();
    reader.onload = () => {
      base64Content = (reader.result as string).split(',')[1];

      this.uploadFile(base64Content, nombreArchivo, descripcion, clasificacion);
    };
    reader.readAsDataURL(this.selectedFile);
  }

  uploadFile(archivo: string, nombreArchivo: string, descripcion: string, clasificacion: string): void {
    const file: CargaArchivo = {
      idMolde: Number(this.data.id),
      nombreArchivo: nombreArchivo,
      archivo: archivo,
      descripcion: descripcion,
      clasificacion: clasificacion
    };

    const uploadService = this.tipo === "pdf" ? this.moldesService.postPlano(file) : this.moldesService.postFoto(file);

    uploadService.subscribe({
      next: (response: any) => {
        this.openSnackBar(this.tipo === "pdf" ? "Plano subido" : "Foto subida", "X", "green-snackbar");
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al subir el archivo', error);
        this.openSnackBar("Error al subir el archivo", "X", "red-snackbar");
        this.resetForm();
      },
      complete: () => {
        this.uploading = false;
        this.buttonText = 'Subir';
        this.cdRef.detectChanges();
      }
    });
  }

  private resetForm(): void {
    this.uploading = false;
    this.buttonText = 'Subir';
    this.selectedFile = null;
    this.uploadForm.reset();

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.uploadForm.patchValue({ archivo: null, nombreArchivo: '' });
    this.cdRef.detectChanges();
  }

  openSnackBar(message: string, action: string, className: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: className
    });
  };
}