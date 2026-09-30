import { AfterViewInit, Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// * Services.
import { FormulasService } from 'app/modules/abm/abm-formula/formulas.service';
import { MaterialsService } from 'app/modules/abm/abm-formula/materials.service';
import { TableDataService } from 'app/shared/services/table-data.service';

// * Interfaces.
import {
  IFormula,
  IFormulasResponse,
} from 'app/modules/abm/abm-formula/formula.interface';
import { IMaterialsResponse } from 'app/modules/abm/abm-formula/material.interface';

// * Forms.
import { FormBuilder, FormGroup } from '@angular/forms';
import { ExportDataComponent } from 'app/shared/components/export-data/export-data.component';

import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';
import { DeleteFormulaConfirmationComponent } from './delete-formula-confirmation.component';

@Component({
  selector: 'app-formulas',
  templateUrl: './formulas.component.html',
})
export class FormulasComponent implements OnInit, AfterViewInit {
  @ViewChild(ExportDataComponent) exportDataComponent: ExportDataComponent;
  @ViewChild(MatPaginator) paginator: MatPaginator;
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
  public isLoading: boolean = false;

  public pageSize: number = 15;
  public pageIndex: number = 0;
  public totalReg: number = 0;

  private formulasBackUp$: IFormula[] = [];

  constructor(
    private _formulas: FormulasService,
    private _materials: MaterialsService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private tableDataService: TableDataService,
    private cdr: ChangeDetectorRef
  ) {
    this.setForm();
  }

  public ngOnInit(): void {
    this.loadMaterials();
    this.getPagedData();
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  public version(name: string): number {
    if (!this.formulas$ || !Array.isArray(this.formulas$)) {
      return 0;
    }
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
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.getPagedData();
  }

  public clearFilters(): void {
    this.form.reset({ name: null, material: null, norma: null });
    this.search();
  }

  public pageChangeEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.getPagedData();
  }

  public getPagedData(): void {
    this.isLoading = true;
    const formValues = this.form.value;

    const params: any = {
      page: this.pageIndex,
      pageSize: this.pageSize,
      idx: 'nombre',
      asc: true
    };

    if (formValues.name && typeof formValues.name === 'string' && formValues.name.trim() !== '') {
      params.nombre = formValues.name.trim();
    }
    if (formValues.material && formValues.material !== 0) {
      params.idMaterial = formValues.material;
    }

    this._formulas.get(params).pipe(
      catchError((err: any) => {
        console.error('FormulasComponent => getPagedData: ', err);
        this.isLoading = false;
        return of({ data: [], page: { totalReg: 0 } });
      })
    ).subscribe((res: any) => {
      this.isLoading = false;
      const normalized = this.tableDataService.normalizeResponse<IFormula>(res, this.pageSize);
      this.formulas$ = normalized.items;
      this.formulasBackUp$ = normalized.items;
      this.totalReg = normalized.total;
      if (this.paginator) {
        this.paginator.length = this.totalReg;
      }
      this.cdr.detectChanges();
    });
  }

  private loadMaterials(): void {
    this._materials.get().pipe(
      catchError((err: any) => {
        console.error('FormulasComponent => loadMaterials: ', err);
        this.materialsFail = true;
        this.form.controls.material.disable();
        return of([]);
      })
    ).subscribe((materials: any) => {
      this.materials$ = materials.data;
    });
  }

  onGetAllData(event: { tipo: string; scope: string }): void {
    const formValues = this.form.value;
    const params: any = {
      page: 0,
      pageSize: 9999,
      idx: 'nombre',
      asc: true
    };
    if (formValues.name && typeof formValues.name === 'string' && formValues.name.trim() !== '') {
      params.nombre = formValues.name.trim();
    }
    if (formValues.material && formValues.material !== 0) {
      params.idMaterial = formValues.material;
    }

    this._formulas.get(params).subscribe((res: any) => {
      const items = this.tableDataService.extractItems<IFormula>(res);
      const formattedData = this.formatDataForExport(items);
      this.procesarExportacion(event.tipo, formattedData);
    });
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
        message: `Se va a borrar la formula <b>${row.nombre}</b>. Si se borra la formula, se perderán todas las parametrizaciones de la revisión. ¿Está seguro que desea continuar?`,
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
            this.getPagedData();
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

  private setForm(): void {
    this.form = this.formBuilder.group({
      name: [null],
      material: [null],
      norma: [null],
    });
  }
}
