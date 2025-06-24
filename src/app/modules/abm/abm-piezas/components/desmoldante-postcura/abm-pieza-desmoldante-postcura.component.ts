import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { DesmoldantePostCura } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-abm-pieza-desmoldante-postcura',
  templateUrl: './abm-pieza-desmoldante-postcura.component.html',
  styleUrls: ['./abm-pieza-desmoldante-postcura.component.scss']
})
export class ABMPiezaDesmoldantePostcuraComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {

  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  desmoldantePostCura$: Observable<DesmoldantePostCura>;
  desmoldantes$: Observable<string[]>;

  mostrarObservacionesDesmoldante = false;
  form: FormGroup;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    super(fb, router, route, abmPiezaService, dialog);

    this.form = this.fb.group({
      desmoldante: [''],
      observacionesDesmoldante: [''],
      postcura: ['']
    });
  }

  ngOnInit(): void {
    if (this.piezaId) {
      this.desmoldantePostCura$ = this.abmPiezaService.getDesmoldantePostCura(this.piezaId);
      this.desmoldantes$ = this.abmPiezaService.getDesmoldantes();

      this.desmoldantePostCura$.subscribe(data => {
        if (data) {
          this.form.patchValue(data);
          this.mostrarObservacionesDesmoldante = data.desmoldante !== 'No';
        }
      });
    }

    this.form.get('desmoldante').valueChanges.subscribe(value => {
      this.mostrarObservacionesDesmoldante = value !== 'No';
    });

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

    const data: DesmoldantePostCura = this.form.value;

    this.abmPiezaService.updateDesmoldantePostCura(this.piezaId, data).subscribe({
      next: () => {
        this.openSnackBar(true, 'Desmoldante/Postcura guardado correctamente.', 'green');
      },
      error: (err) => {
        console.error('Error al guardar Desmoldante/Postcura', err);
        this.openSnackBar(false, 'Error al guardar los datos.', 'red');
      }
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