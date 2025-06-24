import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Finalizacion } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImgModalDialogComponent } from 'app/modules/prompts/img-modal/img-modal.component';

@Component({
  selector: 'app-abm-pieza-finalizacion',
  templateUrl: './abm-pieza-finalizacion.component.html',
  styleUrls: ['./abm-pieza-finalizacion.component.scss']
})
export class ABMPiezaFinalizacionComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  finalizacion$: Observable<Finalizacion>;
  selectedFile: File | null = null;
  safeImageUrl: SafeUrl | null = null;
  initialImageBase64: string | null = null;
  form: FormGroup;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private snackBar: MatSnackBar,
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
      this.finalizacion$ = this.abmPiezaService.getFinalizacion(this.piezaId);
      this.finalizacion$.subscribe(data => {
        if (data) {
          this.form.patchValue(data);
          if (data.imagenEmbalaje) {
            this.initialImageBase64 = data.imagenEmbalaje;
            const base64Image = data.imagenEmbalaje.startsWith('data:image') ? data.imagenEmbalaje : 'data:image/png;base64,' + data.imagenEmbalaje;
            this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(base64Image);
          }
        }
      });
    }

    if (this.mode === 'view') {
      this.form.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      const currentMode = changes.mode.currentValue;
      if (currentMode === 'view') {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }

  public guardar(): void {
    if (this.form.invalid) {
      this.openSnackBar(false, 'El formulario no es válido.', 'red');
      return;
    }

    const saveData = (imageBase64: string | null) => {
      const data: Finalizacion = {
        ...this.form.value,
        imagenEmbalaje: imageBase64
      };

      this.abmPiezaService.updateFinalizacion(this.piezaId, data).subscribe({
        next: () => {
          this.openSnackBar(true, 'Finalización guardada correctamente.', 'green');
        },
        error: (err) => {
          console.error('Error al guardar la finalización', err);
          this.openSnackBar(false, 'Error al guardar los datos.', 'red');
        }
      });
    };

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        saveData(e.target.result);
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
    if (!this.safeImageUrl) {
      return;
    }
    this.dialog.open(ImgModalDialogComponent, {
      data: {
        imgSrc: this.safeImageUrl,
        imgType: 'url',
        title: 'Imagen de Embalaje',
        imgAlt: 'Imagen de embalaje'
      },
      width: '80%',
      maxWidth: '800px'
    });
  }

  private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
    const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
    const defaultCss: string = css ? css : 'red';
    const snackBarMessage = message ? message : defaultMessage;
    const snackBarCss = css ? css : defaultCss;
    const snackBarDuration = duration ? duration : 5000;

    this.snackBar.open(snackBarMessage, 'X', {
      duration: snackBarDuration,
      panelClass: `${snackBarCss}-snackbar`,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}