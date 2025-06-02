import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Pieza } from '../../models/pieza.model';
import { ABMPiezaService } from '../../abm-piezas.service';
import { Router } from '@angular/router';
import { Observable, forkJoin, of, Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError } from 'rxjs/operators';

import {
  IFormula,
  IFormulasResponse,
} from 'app/shared/models/formula.interface';
import { IMaterialsResponse } from 'app/shared/models/material.interface';
import { FormulasService } from 'app/shared/services/formulas.service';
import { MaterialsService } from 'app/shared/services/materials.service';


@Component({
  selector: 'app-abm-piezas-grilla',
  templateUrl: './abm-piezas-grilla.component.html',
  styleUrls: ['./abm-piezas-grilla.component.scss'],
})
export class ABMPiezasGrillaComponent implements OnInit {
  @ViewChild('formulaInput') formulaInput: ElementRef<HTMLInputElement>;
  @ViewChild('materialInput') materialInput: ElementRef<HTMLInputElement>;

  component = "Grilla";
  piezas: Pieza[] = [];
  displayedColumns: string[] = [
    'vigente',
    'nombre',
    'formula',
    'material',
    'revision',
    'fechaRevision',
    'tipo',
    'acciones'
  ];
  searchForm: FormGroup;

  totalReg: number = 0;
  pageSize: number = 50;
  pageIndex: number = 0;

  dataSource = new MatTableDataSource<Pieza>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  formulas$: Observable<IFormula[]>;
  materials$: Observable<IFormula[]>;
  formulasFail: boolean = false;
  materialsFail: boolean = false;

  soloVigentes = new FormControl(false);

  private readonly _destroying$ = new Subject<void>();

  constructor(
    private abmPiezaService: ABMPiezaService,
    private router: Router,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private _formulas: FormulasService,
    private _materials: MaterialsService,
  ) {
    this.searchForm = this.formBuilder.group({
      nombre: [null],
      formula: [null],
      material: [null],
      revision: [null],
    });
  }

  ngOnInit(): void {
    this.loadAutocompleteData();
    this.cargarPiezas();

    this.soloVigentes.valueChanges.subscribe(() => {
      this.cargarPiezas();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  goToEdit(rowId: number): void {
    const message = this.sanitizer.bypassSecurityTrustHtml(
      'La edición de la pieza no genera una nueva revisión e impacta en los procesos que esté relacionada ¿Está seguro que desea editarla?'
    );
    this.openConfirmationModal(message, () => {
      this.router.navigate(['/procesos-piezas/' + rowId + '/edit']);
    }, 'Editar Pieza');
  }

  generarNuevaRevision(rowId: number): void {
    const message = this.sanitizer.bypassSecurityTrustHtml(
      'La nueva revisión no quedará vigente hasta que la marques como tal. Mientras tanto podrás editar los valores sin que impacten en el sistema ¿Estás seguro que deseas crear una nueva revisión?'
    );
    this.openConfirmationModal(message, () => {
      // Lógica service
    }, 'Nueva Revisión');
  }

  marcarVigente(pieza: Pieza): void {
    const message = this.sanitizer.bypassSecurityTrustHtml(
      `Estas a punto de marcar la revisión ${pieza.revision} de la pieza ${pieza.nombre} como vigente. Esto impactará hará que los valores de la misma empiecen a impactar en el sistema de ahora en adelante ¿Estás seguro que deseás marcarla como vigente?`
    );
    this.openConfirmationModal(message, () => {
      // Lógica service
    }, 'Marcar como Vigente');
  }

  goToView(rowId: number): void {
    this.router.navigate(['/procesos-piezas/' + rowId + '/view']);
  }

  cargarPiezas(): void {
    this.abmPiezaService.getPiezas().subscribe(piezas => {
      if (this.soloVigentes.value) {
        this.piezas = piezas.filter(pieza => pieza.vigente);
      } else {
        this.piezas = piezas;
      }
      this.dataSource = new MatTableDataSource<Pieza>(this.piezas);
      this.dataSource.paginator = this.paginator;
      this.totalReg = this.piezas.length;
    });
  }

  handlePageEvent(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.cargarPiezas();
  }

  search(): void {
    console.log('Buscar con los filtros:', this.searchForm.value);
  }

  limpiarFiltros(): void {
    this.searchForm.reset();
    this.soloVigentes.setValue(false);
    this.cargarPiezas();
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
        type: 'warning',
        onConfirm: onConfirm
      }
    });
  }

  displayFn(item: any): string {
    return item && item.nombre ? item.nombre : '';
  }

  clearFormulaInput(): void {
    this.searchForm.get('formula')?.setValue(null);
    this.formulaInput.nativeElement.value = '';
  }

  clearMaterialInput(): void {
    this.searchForm.get('material')?.setValue(null);
    this.materialInput.nativeElement.value = '';
  }

  loadAutocompleteData(): void {
    const error: string = 'ABMPiezasGrillaComponent => loadAutocompleteData: ';

    forkJoin([
      this._materials.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._materials.get() ', err);
          this.materialsFail = true;
          this.searchForm.controls.material.disable();
          return of([]);
        })
      ),
      this._formulas.get().pipe(
        catchError((err: any) => {
          console.error(error, 'this._formulas.get() ', err);
          this.formulasFail = true;
          this.searchForm.controls.formula.disable();
          return of([]);
        })
      ),
    ]).subscribe({
      next: ([materials, formulas]: [
        IMaterialsResponse,
        IFormulasResponse
      ]) => {
        this.materials$ = of(materials.data);
        this.formulas$ = of(formulas.data);
      },
      error: (err: any) => console.error(error, err),
      complete: () => { },
    });
  }
}