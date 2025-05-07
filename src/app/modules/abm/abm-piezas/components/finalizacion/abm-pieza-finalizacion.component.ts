import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Finalizacion } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  refiladoControl = new FormControl('');
  identificacionControl = new FormControl('');
  embalajeControl = new FormControl('');
  imagenEmbalajeControl = new FormControl('');

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
      refilado: this.refiladoControl,
      identificacion: this.identificacionControl,
      embalaje: this.embalajeControl,
      imagenEmbalaje: this.imagenEmbalajeControl
    });
  }

  ngOnInit(): void {
    this.finalizacion$ = this.abmPiezaService.getFinalizacion(this.piezaId);
    this.finalizacion$.subscribe(data => {
      this.form.patchValue({
        refilado: data.refilado,
        identificacion: data.identificacion,
        embalaje: data.embalaje,
        imagenEmbalaje: data.imagenEmbalaje
      });

      if (data.imagenEmbalaje) {
        const base64Image = 'data:image/png;base64,' + data.imagenEmbalaje;
        this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(base64Image);
        if (data.imagenEmbalaje.startsWith('data:image')) {
          this.base64ToFile(data.imagenEmbalaje, 'imagenEmbalaje')
            .then(file => {
              this.selectedFile = file;
            });
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      const mode = changes.mode.currentValue;

      if (mode === 'view') {
        this.refiladoControl.disable();
        this.identificacionControl.disable();
        this.embalajeControl.disable();
      } else {
        this.refiladoControl.enable();
        this.identificacionControl.enable();
        this.embalajeControl.enable();
      }
    }
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

  guardarFinalizacion(): void {
    if (this.form.valid) {
      let imagenBase64 = null;
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          imagenBase64 = e.target.result;

          const data: Finalizacion = {
            refilado: this.form.get('refilado').value,
            identificacion: this.form.get('identificacion').value,
            embalaje: this.form.get('embalaje').value,
            imagenEmbalaje: imagenBase64
          };

          this.abmPiezaService.updateFinalizacion(this.piezaId, data).subscribe(() => {
            this.openSnackBar(true, 'Finalización guardada (mock).', 'green');
          });
        }
        reader.readAsDataURL(this.selectedFile);
      } else {
        const data: Finalizacion = {
          refilado: this.form.get('refilado').value,
          identificacion: this.form.get('identificacion').value,
          embalaje: this.form.get('embalaje').value,
          imagenEmbalaje: this.form.get('imagenEmbalaje').value
        };

        this.abmPiezaService.updateFinalizacion(this.piezaId, data).subscribe(() => {
          this.openSnackBar(true, 'Finalización guardada (mock).', 'green');
        });
      }
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      this.form.patchValue({
        imagenEmbalaje: file.name
      });
      this.form.updateValueAndValidity();
      this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
      this.cdRef.detectChanges();
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.form.patchValue({
      imagenEmbalaje: ''
    });
    this.safeImageUrl = null;

    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.form.updateValueAndValidity();
    this.cdRef.detectChanges();
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