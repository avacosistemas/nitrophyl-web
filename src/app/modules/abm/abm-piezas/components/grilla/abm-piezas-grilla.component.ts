import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
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
import { Cliente } from 'app/shared/models/cliente.model';
import { ClientesService } from 'app/shared/services/clientes.service';

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
    'vigente', 'tipo', 'material',
    'formula', 'codigo', 'denominacion', 'cliente', 'piezaPersonalizada', 'acciones'
  ];

// 'revision', 'fechaRevision',

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<Pieza>([]);
  totalReg: number = 0;
  isLoading = true;

  tiposPieza: { id: number; nombre: string }[] = [];
  formulasFail: boolean = false;
  materialsFail: boolean = false;

  clientesDisponibles: Cliente[] = [];

  soloVigentes = new FormControl(true);

  private allFormulas: IFormula[] = [];
  private allMaterials: any[] = [];

  filteredFormulas$: Observable<IFormula[]>;
  filteredMaterials$: Observable<any[]>;
  filteredClientes$: Observable<Cliente[]>;

  constructor(
    private abmPiezaService: ABMPiezaService,
    private router: Router,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService,
    private _formulas: FormulasService,
    private _materials: MaterialsService,
    private _clientesService: ClientesService,
    private _notificationService: NotificationService
  ) {
    this.searchForm = this.formBuilder.group({
      nombre: [null],
      idFormula: [null],
      idMaterial: [null],
      tiposPieza: [null],
      soloVigentes: [true],
      idCliente: [null]
    });
  }

  ngOnInit(): void {
    this.loadAutocompleteData();
    this.loadClientesDropdown();
  }

  ngAfterViewInit(): void {
    if (!this.paginator || !this.sort) {
      this.isLoading = false;
      return;
    }

    this.dataSource.sort = this.sort;

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        tap(() => this.isLoading = true),
        switchMap(() => {
          const params = this.buildRequestParams();
          return this.abmPiezaService.getPiezas(params).pipe(
            catchError(() => {
              this.isLoading = false;
              this.notificationService.showError('Error al cargar los datos de la grilla.');
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

    setTimeout(() => {
      this.paginator.page.emit();
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
      soloVigentes: formValues.soloVigentes,
      nombre: formValues.nombre,
      idFormula: typeof formValues.idFormula === 'object' ? formValues.idFormula?.id : formValues.idFormula,
      idMaterial: typeof formValues.idMaterial === 'object' ? formValues.idMaterial?.id : formValues.idMaterial,
      idCliente: typeof formValues.idCliente === 'object' ? formValues.idCliente?.id : formValues.idCliente,
    };

    if (formValues.tiposPieza && formValues.tiposPieza.length > 0) {
        params.idTipoPieza = formValues.tiposPieza.join(',');
    }

    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value === null || value === undefined || value === '') {
            delete params[key];
        }
    });

    return params;
  }

  clearCliente(event: Event): void {
        event.stopPropagation();
        this.searchForm.get('idCliente').setValue(null);
    }

  private refreshGrid(): void {
    this.paginator.page.emit();
  }

  search(): void {
    this.paginator.pageIndex = 0;
    this.paginator.page.emit();
  }

  limpiarFiltros(): void {
    this.searchForm.reset({
      soloVigentes: true
    });
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
          this.notificationService.showSuccess('Nueva revisión generada exitosamente.');
          this.refreshGrid();
        },
        error: (err) => {
          console.error('Error al generar nueva revisión:', err);
          this.notificationService.showError('Error al generar la nueva revisión.');
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
          this.notificationService.showSuccess('Pieza marcada como vigente exitosamente.');
          this.refreshGrid();
        },
        error: (err) => {
          console.error('Error al marcar como vigente:', err);
          this.notificationService.showError('Error al marcar la pieza como vigente.');
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

  loadClientesDropdown(): void {
      this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
          next: (res: any) => {
              this.clientesDisponibles = res?.data || [];
              this.filteredClientes$ = this.searchForm.get('idCliente').valueChanges.pipe(
                  startWith(''),
                  map(value => this._filterClientes(value))
              );
          },
          error: (err) => {
              console.error('Error al cargar la lista de clientes:', err);
              this._notificationService.showError('Error al cargar la lista de clientes.');
          }
      });
  }

  private _filterClientes(value: string | Cliente): Cliente[] {
      if (!value) {
          return this.clientesDisponibles;
      }
      const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();

      return this.clientesDisponibles.filter(cliente =>
          cliente.nombre.toLowerCase().includes(filterValue) ||
          (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
      );
  }

  loadAutocompleteData(): void {
    const errorMsg: string = 'ABMPiezasGrillaComponent => loadAutocompleteData: ';

    forkJoin({
      materials: this._materials.get().pipe(
        catchError((err: any) => {
          console.error(errorMsg, 'Error en _material', err);
          this.materialsFail = true;
          this.searchForm.get('idMaterial')?.disable();
          return of({ data: [] } as IMaterialsResponse);
        })
      ),
      formulas: this._formulas.get().pipe(
        catchError((err: any) => {
          console.error(errorMsg, 'Error en _formulas:', err);
          this.formulasFail = true;
          this.searchForm.get('idFormula')?.disable();
          return of({ data: [] } as IFormulasResponse);
        })
      ),
      tiposPieza: this.abmPiezaService.getPiezaTipo().pipe(
          catchError((err: any) => {
              console.error(errorMsg, 'Error en getPiezaTipo', err);
              this.notificationService.showError('No se pudieron cargar los tipos de pieza.');
              return of([]);
          })
      )
    }).pipe(takeUntil(this._destroying$))
      .subscribe(({ materials, formulas, tiposPieza }) => {
        this.allMaterials = Array.isArray(materials.data) ? materials.data : [materials.data];
        this.allFormulas = Array.isArray(formulas.data) ? formulas.data : [formulas.data];
        this.tiposPieza = Array.isArray(tiposPieza) ? tiposPieza : [];
        this.setupFilters();
      });
  }

  private setupFilters(): void {
    this.filteredFormulas$ = this.searchForm.get('idFormula').valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.nombre;
        return name ? this._filterFormulas(name) : this.allFormulas.slice();
      })
    );

    this.filteredMaterials$ = this.searchForm.get('idMaterial').valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.nombre;
        return name ? this._filterMaterials(name) : this.allMaterials.slice();
      })
    );
  }

  private _filterFormulas(value: string): IFormula[] {
    const filterValue = value.toLowerCase();
    return this.allFormulas.filter(formula => formula.nombre.toLowerCase().includes(filterValue));
  }

  private _filterMaterials(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.allMaterials.filter(material => material.nombre.toLowerCase().includes(filterValue));
  }
}