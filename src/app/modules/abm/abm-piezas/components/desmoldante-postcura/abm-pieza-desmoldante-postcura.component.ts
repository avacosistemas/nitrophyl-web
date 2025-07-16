import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaService } from '../../abm-piezas.service';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { PiezaProceso } from '../../models/pieza.model';
import { Observable } from 'rxjs';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-abm-pieza-desmoldante-postcura',
  templateUrl: './abm-pieza-desmoldante-postcura.component.html',
  styleUrls: ['./abm-pieza-desmoldante-postcura.component.scss']
})
export class ABMPiezaDesmoldantePostcuraComponent extends ABMPiezaBaseComponent implements OnInit, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() piezaProcesoData: PiezaProceso | null = null;

  form: FormGroup;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
    public dialog: MatDialog
  ) {
    super(fb, router, route, abmPiezaService, dialog);

    this.form = this.fb.group({
      desmoldante: [''],
      postCura: ['']
    });
  }

  ngOnInit(): void {
    if (this.mode === 'view') {
      this.form.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.piezaProcesoData && changes.piezaProcesoData.currentValue) {
      this.patchDesmoldanteForm(changes.piezaProcesoData.currentValue);
    }

    if (changes.mode && !changes.mode.firstChange) {
      if (changes.mode.currentValue === 'view') {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }

  private patchDesmoldanteForm(data: PiezaProceso): void {
    if (!data) return;

    this.form.patchValue({
      desmoldante: data.desmoldante,
      postCura: data.postCura
    });
  }

  public guardar(): void {
    if (this.form.invalid) {
      this.notificationService.showError('El formulario no es válido.');
      return;
    }

    if (!this.piezaId) {
      this.notificationService.showError('No se ha identificado la pieza para guardar.');
      return;
    }

    const dataToSave = {
      desmoldante: this.form.get('desmoldante').value,
      postCura: this.form.get('postCura').value
    };

    this.abmPiezaService.updateDesmoldantePostcura(this.piezaId, dataToSave).subscribe({
      next: () => {
        this.notificationService.showSuccess('Datos de Desmoldante/Postcura guardados correctamente.');
        this.form.markAsPristine();
      },
      error: (err) => {
        console.error('Error al guardar Desmoldante/Postcura', err);
        this.notificationService.showError('Error al guardar los datos.');
      }
    });
  }
}