import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImgModalDialogComponent } from 'app/modules/prompts/img-modal/img-modal.component';

@Component({
  selector: 'app-abm-pieza-finalizacion',
  templateUrl: './abm-pieza-finalizacion.component.html',
  styleUrls: ['./abm-pieza-finalizacion.component.scss']
})
export class ABMPiezaFinalizacionComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  selectedFile: File | null = null;
  safeImageUrl: SafeUrl | null = null;
  initialImageBase64: string | null = null;
  isLoading: boolean = false;
  form: FormGroup;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    super(fb, router, route, abmPiezaService, dialog);
    this.form = this.fb.group({
      refilado: [''],
      identificacion: [''],
      embalaje: [''],
    });
  }

  ngOnInit(): void {
    if (this.piezaId) {
      this.loadTerminacionData();
    }

    if (this.mode === 'view') {
      this.form.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode && !changes.mode.firstChange) {
      if (changes.mode.currentValue === 'view') {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadTerminacionData();
    }
  }

  loadTerminacionData(): void {
    this.isLoading = true;
    this.abmPiezaService.getTerminacion(this.piezaId).subscribe({
      next: (response) => {
        const data = response.data;
        if (data) {
          this.form.patchValue(data);
          if (data.imagenTerminada) {
            this.initialImageBase64 = data.imagenTerminada;
            const base64Image = data.imagenTerminada.startsWith('data:image') ? data.imagenTerminada : 'data:image/png;base64,' + data.imagenTerminada;
            this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(base64Image);
          } else {
            this.initialImageBase64 = null;
            this.safeImageUrl = null;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos de terminación', err);
        if (err.status !== 404) {
          this.notificationService.showError('Error al cargar los datos de terminación.');
        }
        this.isLoading = false;
      }
    });
  }

  public guardar(): void {
    if (this.form.invalid) {
      this.notificationService.showError('El formulario no es válido.');
      return;
    }

    this.isLoading = true;

    const saveData = (imageBase64: string | null) => {
      const dto = {
        ...this.form.value,
        imagenTerminada: imageBase64
      };

      this.abmPiezaService.updateTerminacion(this.piezaId, dto).subscribe({
        next: () => {
          this.notificationService.showSuccess('Datos de terminación guardados correctamente.');
          this.form.markAsPristine();
          this.isLoading = false;
          this.initialImageBase64 = imageBase64;
        },
        error: (err) => {
          console.error('Error al guardar la terminación', err);
          this.notificationService.showError('Error al guardar los datos.');
          this.isLoading = false;
        }
      });
    };

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Content = (e.target.result as string).split(',')[1];
        saveData(base64Content);
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      saveData(this.initialImageBase64);
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
    this.initialImageBase64 = null;

    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.cdRef.detectChanges();
  }

  openImageModal(): void {
    if (!this.safeImageUrl) return;
    this.dialog.open(ImgModalDialogComponent, {
      data: {
        imgSrc: this.safeImageUrl,
        imgType: 'url',
        title: 'Imagen de Pieza Terminada',
        imgAlt: 'Imagen de pieza terminada'
      },
      width: '80%',
      maxWidth: '800px'
    });
  }
}