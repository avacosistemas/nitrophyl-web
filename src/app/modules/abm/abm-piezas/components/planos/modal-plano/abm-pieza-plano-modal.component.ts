import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-abm-pieza-plano-modal',
  templateUrl: './abm-pieza-plano-modal.component.html',
  styleUrls: ['./abm-pieza-plano-modal.component.scss']
})
export class ABMPiezaPlanoModalComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  formSubmitted: boolean = false;
  uploading: boolean = false;
  fileExtension: string = '';
  title: string = '';
  fileTypeDescription: string = '';
  acceptFileTypes: string = '';
  showClassification: boolean = false;
  clasificacionOptions: { value: string; label: string }[] = [];
  serviceUpload: any;

  buttonText: string = 'Subir';

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ABMPiezaPlanoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.title = this.data.title;
    this.fileTypeDescription = this.data.fileTypeDescription;
    this.acceptFileTypes = this.data.acceptFileTypes;
    this.showClassification = this.data.showClassification || false;
    this.clasificacionOptions = this.data.clasificacionOptions || [];
    this.serviceUpload = this.data.serviceUpload;

    this.buildForm();
  }

  private buildForm(): void {
    this.uploadForm = this.formBuilder.group({
      archivo: [null],
      nombreArchivo: [''],
      descripcion: [''],
      clasificacion: ['', this.showClassification ? Validators.required : []],
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

    if (this.showClassification && !this.uploadForm.get('clasificacion').value) {
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
    const file = {
      archivo: archivo,
      nombreArchivo: nombreArchivo,
      descripcion: descripcion,
      clasificacion: clasificacion
    };

    this.serviceUpload(archivo, nombreArchivo, descripcion, clasificacion).subscribe({
      next: (response: any) => {
        this.openSnackBar("Archivo subido", "X", "green-snackbar");
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