import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ABMPiezaService } from '../../../abm-piezas.service';
import { TipoInsumo, Insumo, InsumoPieza } from '../../../models/pieza.model';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, startWith, map, tap, takeUntil, delay } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-abm-pieza-insumo-modal-form',
  templateUrl: './abm-pieza-insumo-modal-form.component.html',
  styleUrls: ['./abm-pieza-insumo-modal-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ABMPiezaInsumoModalFormComponent implements OnInit, OnDestroy {

  insumoForm: FormGroup;
  tiposInsumo$: Observable<TipoInsumo[]> = of([]);
  insumos$: Observable<Insumo[]> = of([]);
  adhesivos$: Observable<string[]> = of([]);
  nivelesTipoInsumo: TipoInsumo[][] = [];
  adhesivoCtrl = new FormControl();
  adhesivosAgregados: string[] = [];
  filteredAdhesivos$: Observable<string[]>;
  private destroy$ = new Subject<void>();
  isEditMode = false;
  currentInsumo: Insumo = null;

  constructor(
    private fb: FormBuilder,
    private abmPiezaService: ABMPiezaService,
    public dialogRef: MatDialogRef<ABMPiezaInsumoModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { insumoPieza?: InsumoPieza },
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.insumoForm = this.fb.group({
      tipos: this.fb.array([]),
      insumo: [null, Validators.required],
      medidaValor: [null],
      medidaObservaciones: [''],
      tratamiento: [''],
      adhesivos: this.fb.array([]),
      observaciones: ['']
    });

    this.filteredAdhesivos$ = this.adhesivoCtrl.valueChanges.pipe(
      startWith(''),
      switchMap(value => this.adhesivos$.pipe(
        map(adhesivos => this._filterAdhesivos(value, adhesivos))
      )),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    this.tiposInsumo$ = this.abmPiezaService.getTiposInsumo();
    this.adhesivos$ = this.abmPiezaService.getAdhesivos();

    if (this.data.insumoPieza) {
      this.isEditMode = true;
      this.cargarDatosInsumo(this.data.insumoPieza);
    } else {
      this.inicializarTiposInsumo();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  compareTipoFn(tipo1: TipoInsumo, tipo2: TipoInsumo): boolean {
    if (!tipo1 || !tipo2) return false;
    return tipo1.id === tipo2.id;
  }

  compareInsumoFn(insumo1: Insumo, insumo2: Insumo): boolean {
    if (!insumo1 || !insumo2) return false;
    return insumo1.id === insumo2.id;
  }

  private _filterAdhesivos(value: string, adhesivos: string[]): string[] {
    const filterValue = value?.toLowerCase() || '';
    return adhesivos.filter(adhesivo => adhesivo.toLowerCase().includes(filterValue));
  }

  agregarAdhesivo(): void {
    const adhesivoValue = this.adhesivoCtrl.value;
    if (adhesivoValue && !this.adhesivosAgregados.includes(adhesivoValue)) {
      this.adhesivosAgregados.push(adhesivoValue);
      this.adhesivoCtrl.setValue('');
      this.actualizarFormularioAdhesivos();
    }
  }

  quitarAdhesivo(adhesivo: string): void {
    this.adhesivosAgregados = this.adhesivosAgregados.filter(a => a !== adhesivo);
    this.actualizarFormularioAdhesivos();
  }

  actualizarFormularioAdhesivos() {
    const adhesivosFormArray = this.insumoForm.get('adhesivos') as FormArray;
    while (adhesivosFormArray.length !== 0) {
      adhesivosFormArray.removeAt(0);
    }
    this.adhesivosAgregados.forEach(adhesivo => {
      adhesivosFormArray.push(this.fb.control(adhesivo));
    });
  }

  inicializarTiposInsumo(): void {
    this.abmPiezaService.getTiposInsumo().pipe(
      takeUntil(this.destroy$),
      tap(tipos => {
        this.nivelesTipoInsumo = [tipos];
        this.createTiposFormArray();
        this.cdr.detectChanges();
      })
    ).subscribe();
  }

  agregarNivelTipoInsumo(tipo: TipoInsumo, index: number): void {

    if (tipo.subniveles && tipo.subniveles.length > 0) {
      if (this.nivelesTipoInsumo.length <= index + 1) {
        this.nivelesTipoInsumo.push([]);
      }

      this.nivelesTipoInsumo[index + 1] = tipo.subniveles;

      this.ajustarTiposFormArray(index + 2);
    } else {
      this.ajustarTiposFormArray(index + 1);
      this.cargarInsumos(tipo.id);
    }

    this.cdr.detectChanges();
  }

  cargarInsumos(tipoId: number): void {
    this.abmPiezaService.getInsumos(tipoId).pipe(
      takeUntil(this.destroy$),
      tap(insumos => {
        this.insumos$ = of(insumos);
        this.cdr.detectChanges();
      })
    ).subscribe();
  }

  ajustarTiposFormArray(length: number): void {
    const tiposFormArray = this.tiposFormArray;

    while (tiposFormArray.length > length) {
      tiposFormArray.removeAt(tiposFormArray.length - 1);
    }

    while (tiposFormArray.length < length) {
      tiposFormArray.push(this.fb.control(null, Validators.required));
    }
  }

  limpiarNivelesSuperiores(index: number): void {
    this.nivelesTipoInsumo = this.nivelesTipoInsumo.slice(0, index + 1);
    this.ajustarTiposFormArray(index + 1);

    this.insumoForm.get('insumo').setValue(null);
    this.insumos$ = of([]);

    this.cdr.detectChanges();
  }

  createTiposFormArray(): void {
    const tiposFormArray = this.fb.array([]);
    for (let i = 0; i < this.nivelesTipoInsumo.length; i++) {
      tiposFormArray.push(this.fb.control(null, Validators.required));
    }
    this.insumoForm.setControl('tipos', tiposFormArray);
  }

  displayFn(insumo: Insumo): string {
    return insumo && insumo.nombre ? insumo.nombre : '';
  }

  displayTipoInsumo(tipo: TipoInsumo): string {
    return tipo ? tipo.nombre : '';
  }

  get tiposFormArray(): FormArray {
    return this.insumoForm.get("tipos") as FormArray;
  }

  onTipoSeleccionado(tipo: TipoInsumo, index: number): void {
    if (index < this.nivelesTipoInsumo.length - 1) {
      this.limpiarNivelesSuperiores(index);
    }

    this.agregarNivelTipoInsumo(tipo, index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.insumoForm.valid) {
      this.dialogRef.close(this.insumoForm.value);
    } else {
      this.openSnackBar(false, 'Por favor, complete todos los campos.', 'red', 5000);
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

  cargarDatosInsumo(insumoPieza: InsumoPieza): void {
    if (!insumoPieza || !insumoPieza.tipo || !Array.isArray(insumoPieza.tipo)) {
      console.error('El insumo a editar no tiene tipo definido o no es un array');
      return;
    }

    this.currentInsumo = insumoPieza.nombreInsumo;

    this.abmPiezaService.getTiposInsumo().pipe(
      takeUntil(this.destroy$),
      tap(tiposInsumo => {
        this.inicializarFormularioConJerarquia(insumoPieza.tipo, insumoPieza, tiposInsumo);
      })
    ).subscribe();
  }

  inicializarFormularioConJerarquia(jerarquia: TipoInsumo[], insumoPieza: InsumoPieza, tiposInsumoRaiz: TipoInsumo[]): void {
    this.nivelesTipoInsumo = [tiposInsumoRaiz];

    for (let i = 0; i < jerarquia.length - 1; i++) {
      const tipoActual = jerarquia[i];
      if (tipoActual.subniveles && tipoActual.subniveles.length > 0) {
        this.nivelesTipoInsumo.push(tipoActual.subniveles);
      } else {
        this.nivelesTipoInsumo.push([]);
      }
    }

    this.createTiposFormArray();

    for (let i = 0; i < jerarquia.length; i++) {
      this.tiposFormArray.at(i).setValue(jerarquia[i]);
    }

    if (jerarquia.length > 0) {
      this.cargarInsumos(jerarquia[jerarquia.length - 1].id);
    }

    this.insumoForm.patchValue({
      insumo: insumoPieza.nombreInsumo,
      medidaValor: insumoPieza.medidaValor,
      medidaObservaciones: insumoPieza.medidaObservaciones,
      tratamiento: insumoPieza.tratamiento,
      observaciones: insumoPieza.observaciones,
    });

    if (insumoPieza.adhesivos && insumoPieza.adhesivos.length > 0) {
      this.adhesivosAgregados = [...insumoPieza.adhesivos];
      this.actualizarFormularioAdhesivos();
    }

    this.cdr.detectChanges();
  }

  configurarNivelesSegunJerarquia(jerarquia: TipoInsumo[], nivelActual: number): void {
    if (nivelActual >= jerarquia.length) return;

    const tipoActual = jerarquia[nivelActual];

    this.tiposFormArray.at(nivelActual).setValue(tipoActual);

    if (nivelActual < jerarquia.length - 1) {
      if (tipoActual.subniveles && tipoActual.subniveles.length > 0) {
        if (this.nivelesTipoInsumo.length <= nivelActual + 1) {
          this.nivelesTipoInsumo.push([]);
        }
        this.nivelesTipoInsumo[nivelActual + 1] = tipoActual.subniveles;

        this.ajustarTiposFormArray(nivelActual + 2);

        this.configurarNivelesSegunJerarquia(jerarquia, nivelActual + 1);
      }
    }

    this.cdr.detectChanges();
  }

  logFormState(): void {
    console.log('Estado actual del formulario:', {
      valid: this.insumoForm.valid,
      value: this.insumoForm.value,
      tipos: this.tiposFormArray.value,
      niveles: this.nivelesTipoInsumo
    });
  }
}