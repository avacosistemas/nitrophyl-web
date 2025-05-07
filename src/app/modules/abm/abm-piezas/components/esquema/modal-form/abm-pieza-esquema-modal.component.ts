import { Component, Inject, OnInit, ChangeDetectorRef, SecurityContext } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Esquema } from '../../../models/pieza.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-abm-pieza-esquema-modal',
  templateUrl: './abm-pieza-esquema-modal.component.html',
  styleUrls: ['./abm-pieza-esquema-modal.component.scss']
})
export class ABMPiezaEsquemaModalComponent implements OnInit {

  formEsquema: FormGroup;
  selectedFile: File | null = null;
  uploading: boolean = false;
  buttonText: string = 'Subir Imagen';
  safeImageUrl: SafeUrl | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ABMPiezaEsquemaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { esquema?: Esquema },
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.formEsquema = this.fb.group({
      titulo: ['', Validators.required],
      imagenBase64: [''],
      pasos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (this.data.esquema) {
      this.formEsquema.patchValue({
        titulo: this.data.esquema.titulo,
        imagenBase64: this.data.esquema.imagenBase64
      });

      if (this.data.esquema.imagenBase64) {
        this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(this.data.esquema.imagenBase64);
        this.base64ToFile(this.data.esquema.imagenBase64, 'imagenEsquema')
          .then(file => {
            this.selectedFile = file;
          });
      }

      this.data.esquema.pasos.forEach(paso => this.agregarPaso(paso));
    } else {
      this.agregarPaso();
    }
  }

  get pasosFormArray(): FormArray {
    return this.formEsquema.get('pasos') as FormArray;
  }

  agregarPaso(paso: string = ''): void {
    this.pasosFormArray.push(this.fb.control(paso, Validators.required));
  }

  quitarPaso(index: number): void {
    this.pasosFormArray.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async base64ToFile(base64String: string, filename: string): Promise<File> {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  onSave(): void {
    if (this.formEsquema.valid) {
      const titulo = this.formEsquema.get('titulo').value;
      const pasos = this.pasosFormArray.value;

      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const imagenBase64 = e.target.result;
          const esquema: Esquema = {
            id: this.data.esquema?.id,
            titulo: titulo,
            imagenBase64: imagenBase64,
            pasos: pasos
          };
          this.dialogRef.close(esquema);
        }
        reader.readAsDataURL(this.selectedFile);
      } else {
        const esquema: Esquema = {
          id: this.data.esquema?.id,
          titulo: titulo,
          imagenBase64: this.formEsquema.get('imagenBase64').value,
          pasos: pasos
        };
        this.dialogRef.close(esquema);
      }
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
      this.formEsquema.patchValue({
        imagenBase64: ''
      });
      this.cdRef.detectChanges();
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.formEsquema.patchValue({
      imagenBase64: ''
    });
    this.safeImageUrl = null;

    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.cdRef.detectChanges();
  }

  openSnackBar(message: string, action: string, className: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: className
    });
  };
}