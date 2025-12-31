import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

// * Services.
import { FormulasService } from 'app/shared/services/formulas.service';
import { MaterialsService } from 'app/shared/services/materials.service';

// * Interfaces.
import {
  IFormula,
  IFormulasResponse,
} from 'app/shared/models/formula.interface';
import { IMaterialsResponse } from 'app/shared/models/material.interface';

// * Forms.
import { FormBuilder, FormGroup } from '@angular/forms';
import { ExportDataComponent } from 'app/modules/prompts/export-data/export-data.component';

import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DeleteFormulaConfirmationComponent } from './delete-formula-confirmation.component';

@Component({
  selector: 'app-formulas',
  templateUrl: './formulas.component.html',
})
export class FormulasComponent implements OnInit, AfterViewInit {
  @ViewChild(ExportDataComponent) exportDataComponent: ExportDataComponent;
  public component: string = 'all';

  public form: FormGroup;
  public materialsFail: boolean = false;
  public materials$: IFormula[] | undefined;

  public formulas$: IFormula[] | undefined;
  public displayedColumns: string[] = [
    'name',
    'material',
    'norma',
    'unidadDureza',
    'durezaMinima',
    'durezaMaxima',
    'fecha',
    'version',
    'actions',
  ];

  public showSuccess: boolean = false;
  public showError: boolean = false;
  public panelOpenState: boolean = false;

  private formulasBackUp$: IFormula[] = [];

  constructor(
    private _formulas: FormulasService,
    private _materials: MaterialsService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.setForm();
  }

  public ngOnInit(): void {
    this.loadData();
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  public version(name: string): number {
    const filteredFormulas = this.formulas$.filter(
      (formula: any) => formula.nombre === name
    );
    if (filteredFormulas.length > 0) { return Math.max(...filteredFormulas.map(formula => formula.version)); }
    return 0;
  }

  public mode(option: number, row: any): void {
    switch (option) {
      case 1:
        this._formulas.setMode('Clone');
        break;
      case 2:
        this._formulas.setMode('View');
        break;
      case 3:
        this._formulas.setTestTitle(row);
        this._formulas.setMode('Test');
        break;
      case 4:
        this._formulas.setMode('Edit');
        break;
      default:
        break;
    }
  }

  public search(): void {
    if (!this.form.controls.name.value && !this.form.controls.material.value) { this.formulas$ = this.formulasBackUp$; }

    if (this.form.controls.name.value && this.form.controls.material.value) { this.compare(); }

    if (this.form.controls.name.value && !this.form.controls.material.value) { this.compareFormulas(); }

    if (!this.form.controls.name.value && this.form.controls.material.value) { this.compareMaterials(); }
  }

  onGetAllData(event: { tipo: string; scope: string }): void {
    if (this.formulas$) {
      const formattedData = this.formatDataForExport(this.formulas$);
      this.procesarExportacion(event.tipo, formattedData);
    }
  }

  formatDataForExport(data: IFormula[]): any[] {
    return data.map((item) => {
      let materialNombre = '';
      if (this.materials$ && item.idMaterial) {
        const material = this.materials$.find(m => m.id === item.idMaterial);
        materialNombre = material ? material.nombre : 'N/A';
      }

      return {
        'Nombre': item.nombre || '',
        'Material': materialNombre,
        'Norma': item.norma || '',
        'Unidad Dureza': item.unidadDureza || '',
        'Dureza Mín.': item.durezaMinima || '',
        'Dureza Máx.': item.durezaMaxima || '',
        'Versión': item.version || '',
        'Fecha': item.fecha || '',
      };
    });
  }

  procesarExportacion(tipo: string, data: any[]): void {
    switch (tipo) {
      case 'csv':
        this.exportDataComponent.descargarCsv(data);
        break;
      case 'excel':
        this.exportDataComponent.descargarExcel(data);
        break;
      case 'pdf':
        this.exportDataComponent.descargarPdf(data);
        break;
      default:
        console.warn('Tipo de exportación no soportado:', tipo);
    }
  }

  public openObservations(row: IFormula): void {
    this.dialog.open(GenericModalComponent, {
      width: '500px',
      data: {
        title: `Observaciones de ${row.nombre}`,
        message: row.observaciones,
        type: 'info',
        icon: 'document-text',
        showCloseButton: true,
        cancelButtonText: 'Cerrar',
        showConfirmButton: false
      }
    });
  }

  public deleteFormula(row: IFormula): void {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmar eliminación',
        message: `Se va a borrar la formula <b>${row.nombre}</b>. Si se borra la formula, se perderan todas las parametrizaciones de todas las revisiones. ¿Está seguro que desea continuar?`,
        type: 'warning',
        icon: 'exclamation',
        showConfirmButton: true,
        confirmButtonText: 'Borrar Fórmula',
        cancelButtonText: 'Cancelar',
        customComponent: DeleteFormulaConfirmationComponent
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        this._formulas.delete(row.id).subscribe({
          next: () => {
            this.showModalMessage('Éxito', 'La fórmula se ha eliminado correctamente.', 'success');
            this.loadData();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'No se pudo eliminar la fórmula debido a que tiene registros asociados (Lotes, Piezas o Informes).';
            this.showModalMessage('Error al eliminar', errorMessage, 'error');
          }
        });
      }
    });
  }

  private showModalMessage(title: string, message: string, type: 'success' | 'error'): void {
    this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: title,
        message: message,
        type: type,
        icon: type === 'success' ? 'check-circle' : 'x-circle',
        showConfirmButton: true,
        confirmButtonText: 'Aceptar'
      }
    });
  }

  private loadData(): void {
    const error: string = 'FormulasComponent => loadData: ';
    forkJoin([
      this._materials.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._materials.get() ', err);
          this.materialsFail = true;
          this.form.controls.material.disable();
          return of([]);
        })
      ),
      this._formulas.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.get() ', err);
          return of([]);
        })
      ),
    ]).subscribe({
      next: ([materials, formulas]: [
        IMaterialsResponse,
        IFormulasResponse
      ]) => {
        this.materials$ = materials.data;
        this.formulas$ = formulas.data;
        this.formulasBackUp$ = formulas.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => { },
    });
  }

  private compare(): void {
    this.formulas$ = this.formulasBackUp$.filter(
      formula =>
        formula.idMaterial === this.form.controls.material.value &&
        formula.nombre
          ?.toLowerCase()
          .includes(this.form.controls.name.value.toLowerCase())
    );
  }

  private compareFormulas(): void {
    this.formulas$ = this.formulasBackUp$.filter((formula: IFormula) =>
      formula.nombre
        ?.toLowerCase()
        .includes(this.form.controls.name.value.toLowerCase())
    );
  }

  private compareMaterials(): void {
    this.formulas$ = this.formulasBackUp$.filter(
      (formula: IFormula) =>
        formula.idMaterial === this.form.controls.material.value
    );
  }

  private setForm(): void {
    this.form = this.formBuilder.group({
      name: [null],
      material: [null],
      norma: [null],
    });
  }
}
