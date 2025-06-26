import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbmPiezaTipoService } from '../../abm-pieza-tipo.service';
import { IPiezaTipo } from '../../models/pieza-tipo.interface';

interface DialogData {
  mode: 'create' | 'edit';
  piezaTipo?: IPiezaTipo;
}

@Component({
  selector: 'app-pieza-tipo-modal',
  templateUrl: './pieza-tipo-modal.component.html'
})
export class PiezaTipoModalComponent implements OnInit {
  form: FormGroup;
  mode: 'create' | 'edit';
  title: string;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<PiezaTipoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private abmPiezaTipoService: AbmPiezaTipoService,
    private snackBar: MatSnackBar
  ) {
    this.mode = this.data.mode;
    this.title = this.mode === 'create' ? 'Crear Tipo de Pieza' : 'Editar Tipo de Pieza';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]]
    });

    if (this.mode === 'edit' && this.data.piezaTipo) {
      this.form.patchValue({ nombre: this.data.piezaTipo.nombre });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const dto = { nombre: this.form.value.nombre };

    const request$ = this.mode === 'create'
      ? this.abmPiezaTipoService.createPiezaTipo(dto)
      : this.abmPiezaTipoService.updatePiezaTipo(this.data.piezaTipo.id, dto);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.openSnackBar(true, `Tipo de pieza ${this.mode === 'create' ? 'creado' : 'actualizado'} correctamente.`, 'green');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.openSnackBar(false, 'Ocurrió un error al guardar los cambios.');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
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