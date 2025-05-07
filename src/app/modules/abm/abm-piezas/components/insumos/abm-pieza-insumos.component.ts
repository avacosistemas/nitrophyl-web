import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ABMPiezaService } from '../../abm-piezas.service';
import { TipoInsumo, Insumo, InsumoPieza } from '../../models/pieza.model';
import { Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeHtml } from '@angular/platform-browser';
import { ABMPiezaInsumoModalFormComponent } from './modal-form/abm-pieza-insumo-modal-form.component';

@Component({
  selector: 'app-abm-pieza-insumos',
  templateUrl: './abm-pieza-insumos.component.html',
  styleUrls: ['./abm-pieza-insumos.component.scss']
})
export class ABMPiezaInsumosComponent extends ABMPiezaBaseComponent implements OnInit {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  tiposInsumo$: Observable<TipoInsumo[]> = of([]);
  insumos$: Observable<Insumo[]> = of([]);
  adhesivos$: Observable<string[]> = of([]);
  insumosPieza = new MatTableDataSource<InsumoPieza>([]);
  sinDatos: boolean = false;

  searchForm: FormGroup;
  displayedColumns: string[] = ['nombreInsumo', 'tipo', 'medida', 'tratamiento', 'adhesivos', 'observaciones']; // Elimina 'acciones' por defecto


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

    this.searchForm = this.fb.group({
      nombre: [''],
      formulaCodigo: [''],
      formulaMaterial: [''],
      revision: ['']
    });
  }

  ngOnInit(): void {
    this.loadInsumosPieza();

    if (this.mode !== 'view') {
      this.displayedColumns.push('acciones');
    }
  }

  loadInsumosPieza(): void {
    if (this.piezaId) {
      this.abmPiezaService.getInsumosPieza(this.piezaId).subscribe(insumos => {
        this.insumosPieza.data = insumos;
        this.sinDatos = insumos.length === 0;
      });
    } else {
      this.sinDatos = true;
      this.insumosPieza.data = [];
    }
  }

  openAddInsumoModal(insumoPieza?: InsumoPieza): void {
    const dialogRef = this.dialog.open(ABMPiezaInsumoModalFormComponent, {
      width: '800px',
      data: { insumoPieza: insumoPieza }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.guardarInsumo(result);
      }
    });
  }

  guardarInsumo(formData: any): void {
    const tipos: TipoInsumo[] = formData.tipos;
    const insumo: Insumo = formData.insumo;
    const medidaValor: number = formData.medidaValor;
    const medidaObservaciones: string = formData.medidaObservaciones;
    const tratamiento: string = formData.tratamiento;
    const observaciones: string = formData.observaciones;
    const adhesivos = formData.adhesivos;

    const nuevoInsumoPieza: InsumoPieza = {
      tipo: tipos,
      nombreInsumo: insumo,
      medidaValor: medidaValor,
      medidaObservaciones: medidaObservaciones,
      tratamiento: tratamiento,
      adhesivos: adhesivos,
      observaciones: observaciones
    };

    const data = this.insumosPieza.data;
    data.push(nuevoInsumoPieza);
    this.insumosPieza.data = data;
    this.sinDatos = false;
    this.openSnackBar(true, 'Insumo guardado (mock).', 'green');
  }

  eliminarInsumo(index: number): void {
    const insumo = this.insumosPieza.data[index];
    if (insumo && insumo.nombreInsumo) {
      const nombreInsumo = insumo.nombreInsumo.nombre;
      const mensaje = this.sanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el insumo <span class="font-bold">${nombreInsumo}</span>?`);
      this.openConfirmationModal(mensaje, () => {
        const data = this.insumosPieza.data;
        data.splice(index, 1);
        this.insumosPieza.data = data;
        this.sinDatos = this.insumosPieza.data.length === 0;
      });
    } else {
      console.warn('No se pudo obtener el nombre del insumo para eliminar.');
      const mensaje = this.sanitizer.bypassSecurityTrustHtml('¿Estás seguro de que quieres eliminar este insumo?');
      this.openConfirmationModal(mensaje, () => {
        const data = this.insumosPieza.data;
        data.splice(index, 1);
        this.insumosPieza.data = data;
        this.sinDatos = this.insumosPieza.data.length === 0;
      });
    }
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

  search(): void {
    console.log('Buscando con los criterios:', this.searchForm.value);
  }

  limpiarFiltros(): void {
    this.searchForm.reset();
    this.loadInsumosPieza();
  }

  openObservacionModal(observacion: string, nombreInsumo: string): void {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '500px',
      data: {
        title: `Observaciones: ${nombreInsumo}`,
        message: observacion,
        icon: 'chat',
        showCloseButton: true,
        showConfirmButton: false,
        type: 'info',
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