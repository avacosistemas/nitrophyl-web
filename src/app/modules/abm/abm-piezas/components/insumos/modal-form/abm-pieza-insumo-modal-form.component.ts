import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ABMPiezaService } from '../../../abm-piezas.service';
import { Insumo, IInsumoTratado, IAdhesivo, ITipoInsumoJerarquico, ITratamiento } from '../../../models/pieza.model';
import { Observable, of, Subject, BehaviorSubject, combineLatest, merge } from 'rxjs';
import { switchMap, startWith, map, takeUntil, debounceTime, catchError } from 'rxjs/operators';
import { NotificationService } from 'app/shared/services/notification.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-abm-pieza-insumo-modal-form',
  templateUrl: './abm-pieza-insumo-modal-form.component.html',
  styleUrls: ['./abm-pieza-insumo-modal-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ABMPiezaInsumoModalFormComponent implements OnInit, OnDestroy {
  @ViewChild('adhesivoInput') adhesivoInput: ElementRef<HTMLInputElement>;
  @ViewChild('tratamientoInput') tratamientoInput: ElementRef<HTMLInputElement>;

  insumoForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  private allTiposInsumo: ITipoInsumoJerarquico[] = [];
  nivelesTipoInsumo: ITipoInsumoJerarquico[][] = [];
  private listaInsumos$ = new BehaviorSubject<Insumo[]>([]);
  filteredInsumos$: Observable<Insumo[]>;
  filteredTratamientos$: Observable<ITratamiento[]>;
  filteredAdhesivos$: Observable<IAdhesivo[]>;

  selectedTipoStock: ITipoInsumoJerarquico['tipoStock'] | null = null;
  unidadesLongitud = ['MM', 'CM', 'M'];

  tratamientoCtrl = new FormControl();
  tratamientosSeleccionados: ITratamiento[] = [];
  adhesivoCtrl = new FormControl();
  adhesivosSeleccionados: IAdhesivo[] = [];

  private destroy$ = new Subject<void>();
  private refreshAdhesivos$ = new Subject<void>();
  private refreshTratamientos$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private abmPiezaService: ABMPiezaService,
    public dialogRef: MatDialogRef<ABMPiezaInsumoModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idPieza: number, insumoTratado?: IInsumoTratado },
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.insumoForm = this.fb.group({
      tipos: this.fb.array([]),
      insumo: [{ value: null, disabled: true }, Validators.required],
      tratamientos: [[]],
      adhesivos: [[]],
      observaciones: [''],
      unidades: [null],
      unidadMedida: [null],
      medida1: [null],
      medida2: [null],
      unidadMedidaLongitud: [null]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.insumoTratado;
    this.setupAutocompletes();
    this.setupDynamicValidators();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.abmPiezaService.getTiposInsumo().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.allTiposInsumo = response.data || [];
        if (this.isEditMode) {
          this.populateFormForEdit();
        } else {
          const nivel1 = this.allTiposInsumo.filter(t => t.padre === null);
          this.nivelesTipoInsumo = [nivel1];
          this.tiposFormArray.push(this.fb.control(null, Validators.required));
          this.isLoading = false;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar los tipos de insumo.');
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  get tiposFormArray(): FormArray {
    return this.insumoForm.get('tipos') as FormArray;
  }

  onTipoSeleccionado(tipoSeleccionado: ITipoInsumoJerarquico, nivelActual: number): void {
    this.nivelesTipoInsumo.splice(nivelActual + 1);
    while (this.tiposFormArray.length > nivelActual + 1) {
      this.tiposFormArray.removeAt(nivelActual + 1);
    }

    this.insumoForm.get('insumo').reset();
    this.selectedTipoStock = tipoSeleccionado.tipoStock || null;

    this.updateValidatorsByStockType(true);

    this.loadInsumosForTipo(tipoSeleccionado.id);

    const hijos = this.allTiposInsumo.filter(t => t.padre?.id === tipoSeleccionado.id);
    if (hijos.length > 0) {
      this.nivelesTipoInsumo.push(hijos);
      this.tiposFormArray.push(this.fb.control(null));
    }

    this.cdr.markForCheck();
  }

  clearTipo(levelToClear: number): void {
    this.tiposFormArray.at(levelToClear).reset(null, { emitEvent: false });
    this.nivelesTipoInsumo.splice(levelToClear + 1);
    while (this.tiposFormArray.length > levelToClear + 1) {
      this.tiposFormArray.removeAt(levelToClear + 1);
    }

    const parentLevel = levelToClear - 1;
    const parentTipo = this.tiposFormArray.at(parentLevel).value as ITipoInsumoJerarquico;

    this.selectedTipoStock = parentTipo.tipoStock || null;
    this.updateValidatorsByStockType(true);
    this.loadInsumosForTipo(parentTipo.id);
    this.cdr.markForCheck();
  }

  private loadInsumosForTipo(idTipo: number): void {
    this.isLoading = true;
    this.insumoForm.get('insumo').disable();
    this.insumoForm.get('insumo').reset();
    this.abmPiezaService.getInsumosPorTipo(idTipo)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.listaInsumos$.next(res.data.page || []);
        this.insumoForm.get('insumo').enable();
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private setupDynamicValidators(): void {
    this.insumoForm.get('unidadMedida').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.selectedTipoStock === 'ROLLOM2DIAM') {
        this.updateValidatorsByStockType(false);
      }
    });
  }

  private updateValidatorsByStockType(resetFields: boolean): void {
    const controls = ['unidades', 'unidadMedida', 'medida1', 'medida2', 'unidadMedidaLongitud'];

    if (resetFields) {
      controls.forEach(c => {
        const control = this.insumoForm.get(c);
        control.reset(null, { emitEvent: false });
      });
    }

    controls.forEach(c => this.insumoForm.get(c).clearValidators());

    const positiveNumberRequired = [Validators.required, Validators.min(0.0001)];

    switch (this.selectedTipoStock) {
      case 'ROLLOM2DIAM':
        this.insumoForm.get('unidades').setValidators(positiveNumberRequired);
        this.insumoForm.get('unidadMedida').setValidators(Validators.required);
        const tipoMedida = this.insumoForm.get('unidadMedida').value;
        if (tipoMedida === 'DIAMETRO') {
          this.insumoForm.get('medida1').setValidators(positiveNumberRequired);
          this.insumoForm.get('unidadMedidaLongitud').setValidators(Validators.required);
        } else if (tipoMedida === 'SUPERFICIE') {
          this.insumoForm.get('medida1').setValidators(positiveNumberRequired);
          this.insumoForm.get('medida2').setValidators(positiveNumberRequired);
          this.insumoForm.get('unidadMedidaLongitud').setValidators(Validators.required);
        }
        break;
      case 'UNIDAD':
      case 'GRAMOSUNIDAD':
        this.insumoForm.get('unidades').setValidators(positiveNumberRequired);
        break;
      case 'UNIDADXMETRO':
        this.insumoForm.get('unidades').setValidators(positiveNumberRequired);
        this.insumoForm.get('medida1').setValidators(positiveNumberRequired);
        this.insumoForm.get('unidadMedidaLongitud').setValidators(Validators.required);
        break;
    }

    controls.forEach(c => this.insumoForm.get(c).updateValueAndValidity({ emitEvent: false }));
    this.cdr.markForCheck();
  }

  onSave(): void {
    if (this.insumoForm.invalid) {
      this.insumoForm.markAllAsTouched();
      this.notificationService.showError('Por favor, complete todos los campos requeridos.');
      return;
    }
    const insumoSeleccionado = this.insumoForm.get('insumo').value;
    if (!insumoSeleccionado || typeof insumoSeleccionado !== 'object') {
      this.notificationService.showError('Debe seleccionar un Insumo válido de la lista.');
      return;
    }

    this.isLoading = true;
    const formValue = this.insumoForm.getRawValue();
    const dto = {
      idPieza: this.data.idPieza,
      idInsumo: insumoSeleccionado.id,
      observaciones: formValue.observaciones || null,
      tratamientos: this.tratamientosSeleccionados.map(t => ({ id: t.id })),
      adhesivos: this.adhesivosSeleccionados.map(a => ({ id: a.id })),
      unidades: formValue.unidades || null,
      unidadMedida: formValue.unidadMedida || null,
      medida1: formValue.medida1 || null,
      medida2: formValue.medida2 || 0,
      unidadMedidaLongitud: formValue.unidadMedidaLongitud || null,
    };

    const request$ = this.isEditMode
      ? this.abmPiezaService.updateInsumoTratado(this.data.insumoTratado.id, dto)
      : this.abmPiezaService.createInsumoTratado(dto);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess(`Insumo ${this.isEditMode ? 'actualizado' : 'agregado'} correctamente.`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError(`Error al guardar: ${err.error?.data || 'Error desconocido'}`);
      }
    });
  }

  private populateFormForEdit(): void {
    const insumoData = this.data.insumoTratado;
    this.tratamientosSeleccionados = insumoData.tratamientos || [];
    this.adhesivosSeleccionados = insumoData.adhesivos || [];
    this.selectedTipoStock = insumoData.tipo.tipoStock;

    const path = this.buildTipoHierarchyPath(insumoData.tipo);
    path.forEach((tipo, index) => {
      const nivel = index === 0
        ? this.allTiposInsumo.filter(t => !t.padre)
        : this.allTiposInsumo.filter(t => t.padre?.id === tipo.padre?.id);
      this.nivelesTipoInsumo.push(nivel);
      this.tiposFormArray.push(this.fb.control(tipo, Validators.required));
    });
    this.insumoForm.get('tipos').disable();

    this.abmPiezaService.getInsumosPorTipo(insumoData.tipo.id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.listaInsumos$.next(res.data.page || []);
      const insumoObj = (res.data.page || []).find(i => i.id === insumoData.idInsumo);

      this.insumoForm.patchValue({
        insumo: insumoObj,
        observaciones: insumoData.observaciones,
        unidades: insumoData.unidades,
        unidadMedida: insumoData.unidadMedida,
        medida1: insumoData.medida1,
        medida2: insumoData.medida2,
        unidadMedidaLongitud: insumoData.unidadMedidaLongitud
      });

      this.updateValidatorsByStockType(false);
      this.updateTratamientosFormControl();
      this.updateAdhesivosFormControl();
      this.insumoForm.get('insumo').enable();
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private buildTipoHierarchyPath(tipo: ITipoInsumoJerarquico): ITipoInsumoJerarquico[] {
    const path: ITipoInsumoJerarquico[] = [];
    let current = tipo;
    while (current) {
      path.unshift(current);
      current = current.padre;
    }
    return path;
  }

  private setupAutocompletes(): void {
    this.filteredInsumos$ = combineLatest([
      this.insumoForm.get('insumo').valueChanges.pipe(startWith('')),
      this.listaInsumos$
    ]).pipe(
      map(([value, insumos]) => {
        const filterValue = (typeof value === 'string' ? value : value?.nombre || '').toLowerCase();
        return insumos.filter(insumo => insumo.nombre.toLowerCase().includes(filterValue));
      })
    );

    const tratamientosTriggers$ = merge(this.tratamientoCtrl.valueChanges, this.refreshTratamientos$);
    this.filteredTratamientos$ = tratamientosTriggers$.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(() => {
        const searchTerm = this.tratamientoCtrl.value || '';
        return this.abmPiezaService.buscarTratamientos(searchTerm).pipe(
          map(response => response.data || []),
          map(apiTratamientos => apiTratamientos.filter(apiT => !this.tratamientosSeleccionados.some(selT => selT.id === apiT.id))),
          catchError(() => of([]))
        );
      })
    );

    const adhesivosTriggers$ = merge(this.adhesivoCtrl.valueChanges, this.refreshAdhesivos$);
    this.filteredAdhesivos$ = adhesivosTriggers$.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(() => {
        const searchTerm = this.adhesivoCtrl.value || '';
        return this.abmPiezaService.buscarAdhesivos(searchTerm).pipe(
          map(response => response.data || []),
          map(apiAdhesivos => apiAdhesivos.filter(apiA => !this.adhesivosSeleccionados.some(selA => selA.id === apiA.id))),
          catchError(() => of([]))
        );
      })
    );
  }

  addTratamiento(event: MatAutocompleteSelectedEvent): void {
    this.tratamientosSeleccionados.push(event.option.value);
    this.tratamientoInput.nativeElement.value = '';
    this.tratamientoCtrl.setValue(null);
    this.updateTratamientosFormControl();
  }

  removeTratamiento(tratamiento: ITratamiento): void {
    const index = this.tratamientosSeleccionados.findIndex(t => t.id === tratamiento.id);
    if (index >= 0) {
      this.tratamientosSeleccionados.splice(index, 1);
      this.updateTratamientosFormControl();
      this.refreshTratamientos$.next();
    }
  }

  private updateTratamientosFormControl(): void {
    this.insumoForm.get('tratamientos').setValue(this.tratamientosSeleccionados.map(t => t.id));
    this.cdr.markForCheck();
  }

  addAdhesivo(event: MatAutocompleteSelectedEvent): void {
    this.adhesivosSeleccionados.push(event.option.value);
    this.adhesivoInput.nativeElement.value = '';
    this.adhesivoCtrl.setValue(null);
    this.updateAdhesivosFormControl();
  }

  removeAdhesivo(adhesivo: IAdhesivo): void {
    const index = this.adhesivosSeleccionados.findIndex(a => a.id === adhesivo.id);
    if (index >= 0) {
      this.adhesivosSeleccionados.splice(index, 1);
      this.updateAdhesivosFormControl();
      this.refreshAdhesivos$.next();
    }
  }

  public clearInsumoSelection(): void {
    this.insumoForm.get('insumo').setValue(null);
  }

  private updateAdhesivosFormControl(): void {
    this.insumoForm.get('adhesivos').setValue(this.adhesivosSeleccionados.map(a => a.id));
    this.cdr.markForCheck();
  }

  displayFn(item: { nombre: string }): string {
    return item?.nombre ?? '';
  }

  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}