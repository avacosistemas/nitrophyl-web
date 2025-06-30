import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, Subject, forkJoin, merge, of } from 'rxjs';
import { startWith, switchMap, map, catchError, takeUntil, tap } from 'rxjs/operators';
import { Pieza } from '../../models/pieza.model';
import { ABMPiezaService } from '../../abm-piezas.service';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { FormulasService } from 'app/shared/services/formulas.service';
import { MaterialsService } from 'app/shared/services/materials.service';
import { IFormula, IFormulasResponse } from 'app/shared/models/formula.interface';
import { IMaterialsResponse } from 'app/shared/models/material.interface';

@Component({
  selector: 'app-abm-piezas-grilla',
  templateUrl: './abm-piezas-grilla.component.html',
  styleUrls: ['./abm-piezas-grilla.component.scss'],
})
export class ABMPiezasGrillaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('formulaInput') formulaInput: ElementRef<HTMLInputElement>;
  @ViewChild('materialInput') materialInput: ElementRef<HTMLInputElement>;

  private _destroying$ = new Subject<void>();

  displayedColumns: string[] = [
    'vigente', 'codigo', 'denominacion', 'tipo', 'material',
    'formula', 'revision', 'fechaRevision', 'acciones'
  ];
  searchForm: FormGroup;
  dataSource = new MatTableDataSource<Pieza>([]);
  totalReg: number = 0;
  isLoading = true;

  formulas$: Observable<IFormula[]>;
  materials$: Observable<any[]>;
  formulasFail: boolean = false;
  materialsFail: boolean = false;

  soloVigentes = new FormControl(true);

  constructor(
    private abmPiezaService: ABMPiezaService,
    private router: Router,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private _formulas: FormulasService,
    private _materials: MaterialsService
  ) {
    this.searchForm = this.formBuilder.group({
      nombre: [null],
      idFormula: [null],
      idMaterial: [null]
      // soloVigentes: [null]
    });
  }

  ngOnInit(): void {
    this.loadAutocompleteData();
  }

  ngAfterViewInit(): void {
    if (!this.paginator || !this.sort) {
      this.isLoading = false;
      return;
    }

    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    merge(this.sort.sortChange, this.paginator.page, this.soloVigentes.valueChanges)
      .pipe(
        startWith({}),
        tap(() => this.isLoading = true),
        switchMap(() => {
          const params = this.buildRequestParams();
          return this.abmPiezaService.getPiezas(params).pipe(
            catchError(() => {
              this.isLoading = false;
              this.openSnackBar('Error al cargar los datos de la grilla.', false);
              return of({ data: { page: [], totalReg: 0 } });
            })
          );
        }),
        map(response => {
          this.isLoading = false;
          if (response && response.data) {
            this.totalReg = response.data.totalReg ?? 0;
            return response.data.page ?? [];
          }
          this.totalReg = 0;
          return [];
        }),
        takeUntil(this._destroying$)
      )
      .subscribe(data => {
        this.dataSource.data = data;
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  private buildRequestParams(): any {
    const formValues = this.searchForm.value;
    const params: any = {
      first: this.paginator.pageIndex * this.paginator.pageSize + 1,
      rows: this.paginator.pageSize,
      asc: this.sort.direction !== 'desc',
      idx: this.sort.active || 'codigo',
      soloVigentes: this.soloVigentes.value,
      nombre: formValues.nombre,
      idFormula: typeof formValues.idFormula === 'object' ? formValues.idFormula?.id : formValues.idFormula,
      idMaterial: typeof formValues.idMaterial === 'object' ? formValues.idMaterial?.id : formValues.idMaterial,
    };

    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return params;
  }

  private refreshGrid(): void {
    this.paginator.page.emit();
  }

  private openSnackBar(message: string, isSuccess: boolean): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: isSuccess ? 'green-snackbar' : 'red-snackbar',
    });
  }

  search(): void {
    this.paginator.pageIndex = 0;
    this.refreshGrid();
  }

  limpiarFiltros(): void {
    this.searchForm.reset();
    this.soloVigentes.setValue(true);
  }

  goToEdit(rowId: number): void {
    this.router.navigate(['/procesos-piezas', rowId, 'edit']);
  }

  goToView(rowId: number): void {
    this.router.navigate(['/procesos-piezas', rowId, 'view']);
  }

  generarNuevaRevision(pieza: Pieza): void {
    const message = this.sanitizer.bypassSecurityTrustHtml(
      `Se creará una nueva revisión para la pieza <b>${pieza.denominacion}</b> (Rev. ${pieza.revision}). Esta nueva revisión no estará vigente. ¿Desea continuar?`
    );
    this.openConfirmationModal(message, () => {
      this.abmPiezaService.clonarPieza(pieza.id).subscribe({
        next: () => {
          this.openSnackBar('Nueva revisión generada exitosamente.', true);
          this.refreshGrid();
        },
        error: (err) => {
          console.error('Error al generar nueva revisión:', err);
          this.openSnackBar('Error al generar la nueva revisión.', false);
        }
      });
    }, 'Generar Nueva Revisión');
  }

  marcarVigente(pieza: Pieza): void {
    const message = this.sanitizer.bypassSecurityTrustHtml(
      `Está a punto de marcar la revisión <b>${pieza.revision}</b> de la pieza <b>${pieza.denominacion}</b> como vigente. Esta acción no se puede deshacer. ¿Está seguro?`
    );
    this.openConfirmationModal(message, () => {
      this.abmPiezaService.marcarVigente(pieza.id).subscribe({
        next: () => {
          this.openSnackBar('Pieza marcada como vigente exitosamente.', true);
          this.refreshGrid();
        },
        error: (err) => {
          console.error('Error al marcar como vigente:', err);
          this.openSnackBar('Error al marcar la pieza como vigente.', false);
        }
      });
    }, 'Marcar como Vigente');
  }

  openConfirmationModal(message: SafeHtml, onConfirm: () => void, title?: string): void {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: title || 'Confirmar acción',
        message: message,
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this._destroying$)).subscribe(result => {
      if (result === true) {
        onConfirm();
      }
    });
  }

  displayFn(item: any): string {
    return item && item.nombre ? item.nombre : '';
  }

  clearFormulaInput(): void {
    this.searchForm.get('idFormula')?.setValue(null);
    if (this.formulaInput) this.formulaInput.nativeElement.value = '';
  }

  clearMaterialInput(): void {
    this.searchForm.get('idMaterial')?.setValue(null);
    if (this.materialInput) this.materialInput.nativeElement.value = '';
  }

  loadAutocompleteData(): void {
    const errorMsg: string = 'ABMPiezasGrillaComponent => loadAutocompleteData: ';

    forkJoin([
      this._materials.get().pipe(
        catchError((err: any) => {
          console.error(errorMsg, 'Error en _material', err);
          this.materialsFail = true;
          this.searchForm.get('idMaterial')?.disable();
          return of({ data: [] } as IMaterialsResponse);
        })
      ),
      this._formulas.get().pipe(
        catchError((err: any) => {
          console.error(errorMsg, 'Error en _formulas:', err);
          this.formulasFail = true;
          this.searchForm.get('idFormula')?.disable();
          return of({ data: [] } as IFormulasResponse);
        })
      ),
    ]).pipe(takeUntil(this._destroying$))
      .subscribe(([materialsResponse, formulasResponse]) => {
        this.materials$ = of(Array.isArray(materialsResponse.data) ? materialsResponse.data : [materialsResponse.data]);
        const formulasData = Array.isArray(formulasResponse.data)
          ? formulasResponse.data
          : [formulasResponse.data];
        this.formulas$ = of(formulasData);
      });
  }
}