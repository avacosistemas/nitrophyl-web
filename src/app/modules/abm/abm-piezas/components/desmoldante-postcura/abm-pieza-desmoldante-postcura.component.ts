import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { DesmoldantePostCura } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  desmoldanteControl = new FormControl('');
  observacionesDesmoldanteControl = new FormControl('');
  postcuraControl = new FormControl('');

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
      desmoldante: this.desmoldanteControl,
      observacionesDesmoldante: this.observacionesDesmoldanteControl,
      postcura: this.postcuraControl
    });
  }

  ngOnInit(): void {
    this.desmoldantePostCura$ = this.abmPiezaService.getDesmoldantePostCura(this.piezaId);
    this.desmoldantes$ = this.abmPiezaService.getDesmoldantes();

    this.desmoldantePostCura$.subscribe(data => {
      this.form.patchValue({
        desmoldante: data.desmoldante,
        observacionesDesmoldante: data.observacionesDesmoldante,
        postcura: data.postcura
      });
      this.mostrarObservacionesDesmoldante = data.desmoldante !== 'No';
    });

    this.form.get('desmoldante').valueChanges.subscribe(value => {
      this.mostrarObservacionesDesmoldante = value !== 'No';
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      const mode = changes.mode.currentValue;

      if (mode === 'view') {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    }
  }

  guardarDesmoldantePostCura(): void {
    if (this.form.valid) {
      const data: DesmoldantePostCura = {
        desmoldante: this.form.get('desmoldante').value,
        observacionesDesmoldante: this.form.get('observacionesDesmoldante').value,
        postcura: this.form.get('postcura').value
      };

      this.abmPiezaService.updateDesmoldantePostCura(this.piezaId, data).subscribe(() => {
        this.openSnackBar(true, 'Desmoldante/PostCura guardado (mock).', 'green');
      });
    }
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