import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ABMPiezaService } from '../../abm-piezas.service';
import { Observable, Subscription, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { startWith, map } from 'rxjs/operators';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { Molde } from '../../models/pieza.model';

@Component({
  selector: 'app-abm-pieza-moldes',
  templateUrl: './abm-pieza-moldes.component.html',
  styleUrls: ['./abm-pieza-moldes.component.scss']
})
export class ABMPiezaMoldesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  moldes = new MatTableDataSource<Molde>([]);
  sinDatos: boolean = false;

  baseDisplayedColumns: string[] = ['nombre'];
  displayedColumnsMoldes: string[];

  filteredMoldes: Observable<Molde[]>;
  moldeCtrl = new FormControl(null, Validators.required);

  private subscription: Subscription = new Subscription();

  moldesMock: Molde[] = [
    { id: 1, nombre: 'Molde A' },
    { id: 2, nombre: 'Molde B' },
    { id: 3, nombre: 'Molde C' },
    { id: 4, nombre: 'Molde D' },
    { id: 5, nombre: 'Molde E' },
  ];

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private domSanitizer: DomSanitizer
  ) {
    super(fb, router, route, abmPiezaService, dialog);
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    this.loadMoldes();

    this.filteredMoldes = this.moldeCtrl.valueChanges.pipe(
      startWith(''),
      map(molde => (molde ? this._filterMoldes(molde) : this.moldesMock.slice())),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();

      if (this.mode === 'view') {
        this.moldeCtrl.disable();
      } else {
        this.moldeCtrl.enable();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setDisplayedColumns(): void {
    if (this.mode === 'view') {
      this.displayedColumnsMoldes = this.baseDisplayedColumns;
    } else {
      this.displayedColumnsMoldes = [...this.baseDisplayedColumns, 'acciones'];
    }
  }

  loadMoldes(): void {
    this.moldes = new MatTableDataSource<Molde>([]);
    this.sinDatos = this.moldes.data.length === 0;
  }

  addMolde(): void {
    if (this.moldeCtrl.valid) {
      const selectedMolde: Molde = this.moldeCtrl.value;

      if (!selectedMolde) {
        this.openSnackBar(false, 'Por favor, seleccione un molde.');
        return;
      }

      const alreadyAdded = this.moldes.data.some(molde => molde.id === selectedMolde.id);
      if (alreadyAdded) {
        this.openSnackBar(false, 'El molde ya está asociado a esta pieza.');
        return;
      }

      const data = this.moldes.data;
      data.push(selectedMolde);
      this.moldes.data = data;
      this.sinDatos = false;

      this.moldeCtrl.setValue(null);
      this.openSnackBar(true, 'Molde agregado (mock).', 'green');

    } else {
      this.openSnackBar(false, 'Por favor, seleccione un molde.');
    }
  }

  eliminarMolde(row: Molde): void {
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el molde <span class="font-bold">${row.nombre}</span>?`);
    this.openConfirmationModal(mensaje, () => {
      const data = this.moldes.data;
      data.splice(data.indexOf(row), 1);
      this.moldes.data = data;
      this.sinDatos = this.moldes.data.length === 0;
      this.openSnackBar(true, 'Molde eliminado (mock).', 'green');
    });
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

  clearMolde(): void {
    this.moldeCtrl.setValue(null);
  }

  displayFn(molde: Molde): string {
    return molde && molde.nombre ? molde.nombre : '';
  }

  private _filterMoldes(value: string): Molde[] {
    const filterValue = value.toLowerCase();
    return this.moldesMock.filter(molde => molde.nombre.toLowerCase().includes(filterValue));
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