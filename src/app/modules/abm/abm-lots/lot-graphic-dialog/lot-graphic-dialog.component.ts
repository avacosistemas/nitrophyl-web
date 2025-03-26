import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { LotService } from 'app/shared/services/lot.service';
import { MachinesService } from 'app/shared/services/machines.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IMachine } from 'app/shared/models/machine.model';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { saveAs } from 'file-saver';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';

export interface GraphicFile {
  id: number;
  maquina: string;
  fecha: string;
}

@Component({
  selector: 'app-lot-graphic-dialog',
  templateUrl: './lot-graphic-dialog.component.html',
  styleUrls: ['./lot-graphic-dialog.component.css'],
})
export class LotGraphicDialogComponent implements OnInit {
  graphicForm: FormGroup;
  selectedFile: File | null = null;
  lotId: number;
  lotNroLote: string;
  machines: IMachine[] = [];

  displayedColumns: string[] = ['maquina', 'fecha', 'actions'];
  dataSource = new MatTableDataSource<GraphicFile>([]);
  hasData: boolean = false;
  files: GraphicFile[] = [];
  formSubmitted: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<LotGraphicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { lotId: number; lotNroLote: string },
    private lotService: LotService,
    private machinesService: MachinesService,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
  ) {
    this.lotId = data.lotId;
    this.lotNroLote = data.lotNroLote;
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadMachines();
    this.loadFiles();
  }

  private buildForm(): void {
    this.graphicForm = this.formBuilder.group({
      archivo: [null],
      idMaquina: [null, Validators.required]
    });
  }

  loadMachines(): void {
    this.machinesService.get().subscribe({
      next: (response) => {
        this.machines = response.data;
      },
      error: (error) => {
        console.error('Error al cargar máquinas:', error);
        this.openSnackBar(false, 'Error al cargar las máquinas.');
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      this.graphicForm.updateValueAndValidity();
      this.cdRef.detectChanges();
    } else {
      this.selectedFile = null;
      this.openSnackBar(false, 'Por favor, seleccione un archivo PDF.');

      const input = event.target as HTMLInputElement;
      input.value = '';
      this.graphicForm.updateValueAndValidity();
      this.cdRef.detectChanges();
    }
  }

  onIdMaquinaChange(): void {
    this.graphicForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  uploadFile(): void {
    this.formSubmitted = true;

    console.log('Valor de selectedFile:', this.selectedFile);
    if (!this.selectedFile) {
      this.openSnackBar(false, 'Por favor, seleccione un archivo PDF.');
      return;
    }

    if (this.graphicForm.valid && this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];

        const idMaquina = this.graphicForm.get('idMaquina').value;

        const payload = {
          archivo: base64Content,
          idLote: this.lotId,
          idMaquina: idMaquina,
        };

        this.lotService.uploadGrafico(payload).subscribe({
          next: (response) => {
            this.openSnackBar(true, 'Gráfico cargado correctamente');
            this.loadFiles();
          },
          error: (error) => {
            console.error('Error al cargar el gráfico', error);
            this.openSnackBar(false, 'Error al cargar el gráfico');
          }
        });
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.openSnackBar(false, 'Por favor, complete todos los campos.');
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
    const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
    const defaultCss: string = option ? 'green' : 'red';
    const snackBarMessage = message ? message : defaultMessage;
    const snackBarCss = css ? css : defaultCss;
    const snackBarDuration = duration ? duration : 5000;

    this.snackBar.open(snackBarMessage, 'X', {
      duration: snackBarDuration,
      panelClass: `${snackBarCss}-snackbar`,
    });
  }

  loadFiles(): void {
    this.lotService.getGraficosLote(this.lotId).subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.files = response.data;
          this.dataSource = new MatTableDataSource<GraphicFile>(this.files);
          this.hasData = this.files.length > 0;
          this.cdRef.detectChanges();
        } else {
          console.error('Error al cargar los gráficos:', response);
          this.openSnackBar(false, 'Error al cargar los gráficos.');
        }
      },
      error: (error) => {
        console.error('Error al cargar los gráficos:', error);
        this.openSnackBar(false, 'Error al cargar los gráficos.');
      }
    });
  }

  previewFile(file: GraphicFile): void {
    this.lotService.downloadGrafico(file.id).subscribe({
      next: (base64Data: string) => {
        if (base64Data) {
          const pdfSrc = this.sanitizeUrl(base64Data);
          this.openPreviewDialog(pdfSrc);
        } else {
          this.openSnackBar(false, 'Error al previsualizar el gráfico.');
        }
      },
      error: (error) => {
        console.error('Error al descargar el gráfico:', error);
        this.openSnackBar(false, 'Error al previsualizar el gráfico.');
      }
    });
  }

  downloadFile(file: GraphicFile): void {
    this.lotService.downloadGrafico(file.id).subscribe({
      next: (base64Data: string) => {
        if (base64Data) {
          const byteCharacters = atob(base64Data);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          const blob = new Blob(byteArrays, { type: 'application/pdf' });

          saveAs(blob, `${this.lotNroLote}-${file.maquina}.pdf`);
        } else {
          this.openSnackBar(false, 'Error al descargar el gráfico.');
        }
      },
      error: (error) => {
        console.error('Error al descargar el gráfico:', error);
        this.openSnackBar(false, 'Error al descargar el gráfico.');
      }
    });
  }

  sanitizeUrl(base64Data: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl('data:application/pdf;base64,' + base64Data);
  }

  openPreviewDialog(pdfSrc: SafeUrl): void {
    this.dialog.open(PdfPreviewComponent, {
      data: {
        pdfSrc: pdfSrc
      },
    });
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.graphicForm.patchValue({
      archivo: null
    });

    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.graphicForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  deleteGraphic(file: GraphicFile): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '40%',
      data: { data: `${this.lotNroLote}-${file.maquina}.pdf`, seccion: 'grafico', boton: 'Eliminar' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.lotService.deleteGrafico(file.id).subscribe({
          next: () => {
            this.openSnackBar(true, 'Gráfico eliminado correctamente.');
            this.loadFiles();
          },
          error: (error) => {
            console.error('Error al eliminar el gráfico:', error);
            this.openSnackBar(false, 'Error al eliminar el gráfico.');
          }
        });
      }
    });
  }
}

@Component({
  selector: 'app-pdf-preview',
  template: `<iframe [src]="data.pdfSrc" width="100%" height="600px" style="min-width:850px" ></iframe>`,
})
export class PdfPreviewComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { pdfSrc: SafeUrl }) { }
}