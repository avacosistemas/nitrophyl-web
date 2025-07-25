import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ABMPiezaService } from '../../../abm-piezas.service';
import { Insumo, IInsumoTratado, IAdhesivo, ITipoInsumoJerarquico, ITratamiento } from '../../../models/pieza.model';
import { Observable, of, Subject, BehaviorSubject, combineLatest, merge } from 'rxjs';
import { switchMap, startWith, map, takeUntil, debounceTime, filter, mapTo, catchError } from 'rxjs/operators';
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

  insumoForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  private allTiposInsumo: ITipoInsumoJerarquico[] = [];
  nivelesTipoInsumo: ITipoInsumoJerarquico[][] = [];

  private listaInsumos$ = new BehaviorSubject<Insumo[]>([]);
  filteredInsumos$: Observable<Insumo[]>;

  filteredTratamientos$: Observable<ITratamiento[]>;
  filteredAdhesivos$: Observable<IAdhesivo[]>;

  adhesivoCtrl = new FormControl();
  adhesivosSeleccionados: IAdhesivo[] = [];

  private destroy$ = new Subject<void>();
  private refreshAdhesivos$ = new Subject<void>();

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
      tratamiento: [null],
      adhesivos: [[]],
      medidaValor: [''],
      medidaObservaciones: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.insumoTratado;
    this.setupAutocompletes();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateFormForEdit(): void {
    const insumoData = this.data.insumoTratado;

    this.abmPiezaService.getInsumosPorTipo(insumoData.tipo.id).subscribe(res => {
      this.listaInsumos$.next(res.data.page || []);
      const insumoObj = (res.data.page || []).find(i => i.id === insumoData.idInsumo);

      this.insumoForm.patchValue({ insumo: insumoObj });
      this.insumoForm.get('insumo').enable();
      this.cdr.markForCheck();
    });

    const path = this.buildTipoHierarchyPath(insumoData.tipo);
    path.forEach((tipo) => {
      const siblings = this.allTiposInsumo.filter(t => t.padre?.id === tipo.padre?.id);
      this.nivelesTipoInsumo.push(siblings.length > 0 ? siblings : this.allTiposInsumo.filter(t => t.padre === null));
      this.tiposFormArray.push(this.fb.control(tipo, Validators.required));
    });

    const tratamientoObj = { id: insumoData.idTratamiento, nombre: insumoData.tratamiento };

    this.insumoForm.patchValue({
      tratamiento: tratamientoObj,
      medidaValor: insumoData.medidaValor,
      medidaObservaciones: insumoData.medidaObservaciones,
      observaciones: insumoData.observaciones
    });

    this.adhesivosSeleccionados = insumoData.adhesivos || [];
    this.updateAdhesivosFormControl();

    this.insumoForm.get('tipos').disable();
    this.isLoading = false;
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

    this.filteredTratamientos$ = this.insumoForm.get('tratamiento').valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const searchTerm = typeof value === 'string' ? value : '';
        return this.abmPiezaService.buscarTratamientos(searchTerm);
      }),
      map(response => response.data || [])
    );

    const adhesivosTriggers$ = merge(
      this.adhesivoCtrl.valueChanges,
      this.refreshAdhesivos$
    );

    this.filteredAdhesivos$ = adhesivosTriggers$.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(() => {
        const searchTerm = this.adhesivoCtrl.value || '';

        return this.abmPiezaService.buscarAdhesivos(searchTerm).pipe(
          map(response => response.data || []),
          map(adhesivosDesdeApi =>
            adhesivosDesdeApi.filter(adhesivoApi =>
              !this.adhesivosSeleccionados.some(adhesivoSel => adhesivoSel.id === adhesivoApi.id)
            )
          ),
          catchError((error: any): Observable<IAdhesivo[]> => {
            console.error('Error al buscar adhesivos:', error);
            return of([]);
          })
        );
      })
    );

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
    this.insumoForm.get('insumo').disable();
    this.listaInsumos$.next([]);

    const hijos = this.allTiposInsumo.filter(t => t.padre?.id === tipoSeleccionado.id);

    if (hijos.length > 0) {
      this.nivelesTipoInsumo.push(hijos);
      this.tiposFormArray.push(this.fb.control(null, Validators.required));
    } else {
      this.isLoading = true;
      this.abmPiezaService.getInsumosPorTipo(tipoSeleccionado.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          this.listaInsumos$.next(res.data.page || []);
          this.insumoForm.get('insumo').enable();
          this.isLoading = false;
          this.cdr.markForCheck();
        });
    }
    this.cdr.markForCheck();
  }

  onTratamientoSelected(tratamiento: ITratamiento): void {
    this.insumoForm.get('tratamiento').setValue(tratamiento, { emitEvent: false });
  }

  addAdhesivo(event: MatAutocompleteSelectedEvent): void {
    const adhesivo = event.option.value as IAdhesivo;
    if (adhesivo && !this.adhesivosSeleccionados.some(a => a.id === adhesivo.id)) {
      this.adhesivosSeleccionados.push(adhesivo);
    }
    if (this.adhesivoInput) {
      this.adhesivoInput.nativeElement.value = '';
    }
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

  private updateAdhesivosFormControl(): void {
    const ids = this.adhesivosSeleccionados.map(a => a.id);
    this.insumoForm.get('adhesivos').setValue(ids);
    this.cdr.markForCheck();
  }

  onSave(): void {
    if (this.insumoForm.invalid) {
      this.insumoForm.markAllAsTouched();
      this.notificationService.showError('Por favor, complete todos los campos requeridos.');
      return;
    }

    const insumoSeleccionado = this.insumoForm.get('insumo').value;
    const tratamientoSeleccionado = this.insumoForm.get('tratamiento').value;

    if (!insumoSeleccionado || typeof insumoSeleccionado !== 'object') {
      this.notificationService.showError('Debe seleccionar un Insumo');
      return;
    }

    this.isLoading = true;
    const formValue = this.insumoForm.getRawValue();

    const dto: any = {
      idPieza: this.data.idPieza,
      idInsumo: insumoSeleccionado.id,
      insumo: insumoSeleccionado.nombre,
      idTratamiento: tratamientoSeleccionado?.id,
      tratamiento: tratamientoSeleccionado?.nombre,
      medidaValor: formValue.medidaValor || null,
      medidaObservaciones: formValue.medidaObservaciones || null,
      observaciones: formValue.observaciones || null,
      adhesivos: this.adhesivosSeleccionados.map(a => ({ id: a.id, nombre: a.nombre }))
    };

    if (!this.isEditMode) {
      const tipoFinal = formValue.tipos[formValue.tipos.length - 1];
      if (!tipoFinal) {
        this.notificationService.showError('Debe seleccionar un tipo de insumo válido.');
        this.isLoading = false;
        return;
      }
      dto.tipo = {
        id: tipoFinal.id,
        nombre: tipoFinal.nombre
      };
    }

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
        const errorMessage = err.error?.message || err.error?.error || 'Error desconocido';
        this.notificationService.showError(`Error al guardar: ${errorMessage}`);
        console.error("Error al guardar insumo:", err);
      }
    });
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