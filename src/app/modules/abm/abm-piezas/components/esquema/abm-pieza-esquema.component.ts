import { Component, OnInit, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { Esquema } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ABMPiezaEsquemaModalComponent } from './modal-form/abm-pieza-esquema-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { ImgModalDialogComponent } from 'app/modules/prompts/img-modal/img-modal.component';

interface DialogData {
  imageUrl: SafeUrl;
  showCloseButton?: boolean;
}

@Component({
  selector: 'app-abm-pieza-esquema',
  templateUrl: './abm-pieza-esquema.component.html',
  styleUrls: ['./abm-pieza-esquema.component.scss']
})
export class ABMPiezaEsquemaComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {

  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  esquemas$: Observable<Esquema[]>;
  esquemas: Esquema[] = [];
  baseDisplayedColumns: string[] = ['imagen', 'tituloPasos'];
  displayedColumns: string[];
  sinDatos: boolean = false;
  selectedImage: SafeUrl | null = null;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {
    super(fb, router, route, abmPiezaService, dialog);
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    this.loadEsquemas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
    }
  }

  setDisplayedColumns(): void {
    if (this.mode === 'view') {
      this.displayedColumns = this.baseDisplayedColumns;
    } else {
      this.displayedColumns = [...this.baseDisplayedColumns, 'acciones'];
    }
  }

  loadEsquemas(): void {
    this.esquemas$ = this.abmPiezaService.getEsquemas(this.piezaId);
    this.esquemas$.subscribe(esquemas => {
      this.esquemas = esquemas.map(esquema => {
        if (esquema.imagenBase64) {
          esquema.safeImagenUrl = this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${esquema.imagenBase64}`);
        }
        return esquema;
      });
      this.sinDatos = esquemas.length === 0;
    });
  }

  openEsquemaModal(esquema?: Esquema): void {
    const dialogRef = this.dialog.open(ABMPiezaEsquemaModalComponent, {
      width: '600px',
      data: { esquema: esquema ? { ...esquema } : null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.guardarEsquema(result);
      }
    });
  }

  guardarEsquema(esquema: Esquema): void {
    this.abmPiezaService.updateEsquema(this.piezaId, esquema).subscribe(() => {
      this.openSnackBar(true, 'Esquema guardado (mock).', 'green');
      this.loadEsquemas();
    });
  }

  eliminarEsquema(esquema: Esquema): void {
    const mensaje = this.sanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el esquema <span class="font-bold">${esquema.titulo}</span>?`);
    this.openConfirmationModal(mensaje, () => {
      this.abmPiezaService.deleteEsquema(this.piezaId, esquema.id).subscribe(() => {
        this.openSnackBar(true, 'Esquema eliminado.', 'green');
        this.loadEsquemas();
      });
    });
  }

  openConfirmationModal(message: SafeHtml, onConfirm: () => void): void {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: message,
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning',
        onConfirm: onConfirm
      }
    });
  }

  openImageModal(esquema: Esquema): void {
    this.dialog.open(ImgModalDialogComponent, {
      data: {
        imgAlt: esquema.titulo,
        imgSrc: esquema.safeImagenUrl,
        imgType: 'url',
        title: esquema.titulo
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