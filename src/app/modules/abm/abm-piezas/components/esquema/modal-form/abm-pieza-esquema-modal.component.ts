import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Esquema, PasoEsquema } from '../../../models/pieza.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ABMPiezaService } from '../../../abm-piezas.service';

@Component({
  selector: 'app-abm-pieza-esquema-modal',
  templateUrl: './abm-pieza-esquema-modal.component.html',
  styleUrls: ['./abm-pieza-esquema-modal.component.scss']
})
export class ABMPiezaEsquemaModalComponent implements OnInit {

  formEsquema: FormGroup;
  selectedFile: File | null = null;
  safeImageUrl: SafeUrl | null = null;
  isEditMode: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ABMPiezaEsquemaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { esquema?: Esquema, idProceso: number },
    private cdRef: ChangeDetectorRef,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private abmPiezaService: ABMPiezaService
  ) {
    this.formEsquema = this.fb.group({
      titulo: ['', Validators.required],
      imagen: [null],
      pasos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.esquema;

    if (this.isEditMode) {
      this.formEsquema.patchValue({
        titulo: this.data.esquema.titulo,
      });

      if (this.data.esquema.imagen) {
        this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${this.data.esquema.imagen}`);
      }

      this.data.esquema.pasos.forEach(paso => this.agregarPaso(paso));
    } else {
      this.agregarPaso();
    }
  }

  get pasosFormArray(): FormArray {
    return this.formEsquema.get('pasos') as FormArray;
  }

  agregarPaso(paso: PasoEsquema = { paso: this.pasosFormArray.length + 1, descripcion: '' }): void {
    const pasoGroup = this.fb.group({
      id: [paso.id],
      paso: [paso.paso],
      descripcion: [paso.descripcion, Validators.required]
    });
    this.pasosFormArray.push(pasoGroup);
  }

  quitarPaso(index: number): void {
    this.pasosFormArray.removeAt(index);
    this.pasosFormArray.controls.forEach((group, i) => {
      (group as FormGroup).get('paso').setValue(i + 1);
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.formEsquema.invalid) {
      this.notificationService.showError('Por favor, complete todos los campos requeridos.');
      return;
    }

    this.isLoading = true;
    const reader = new FileReader();

    const onFileRead = (base64Image: string | null) => {
      const formValue = this.formEsquema.getRawValue();
      const dto = {
        idProceso: this.data.idProceso,
        titulo: formValue.titulo,
        imagen: base64Image,
        pasos: formValue.pasos.map(p => ({
          paso: p.paso,
          descripcion: p.descripcion
        })),
      };

      let request$;
      if (this.isEditMode) {
        const updateDto = { ...dto, id: this.data.esquema.id };
        request$ = this.abmPiezaService.updateEsquema(this.data.esquema.id, updateDto);
      } else {
        request$ = this.abmPiezaService.createEsquema(dto);
      }

      request$.subscribe({
        next: () => {
          this.isLoading = false;
          const message = `Esquema ${this.isEditMode ? 'actualizado' : 'creado'} correctamente.`;
          this.notificationService.showSuccess(message);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar esquema:', err);
          this.notificationService.showError('Ocurrió un error al guardar el esquema.');
        }
      });
    };

    if (this.selectedFile) {
      reader.onload = () => onFileRead((reader.result as string).split(',')[1]);
      reader.readAsDataURL(this.selectedFile);
    } else {
      const existingImage = this.data.esquema?.imagen || null;
      onFileRead(existingImage);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
      this.cdRef.detectChanges();
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.safeImageUrl = null;
    if (this.isEditMode && this.data.esquema.imagen) {
      this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${this.data.esquema.imagen}`);
    }
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
    this.cdRef.detectChanges();
  }
}