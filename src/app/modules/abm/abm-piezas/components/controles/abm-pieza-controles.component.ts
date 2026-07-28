import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { NotificationService } from 'app/shared/services/notification.service';
import { ABMPiezaService } from '../../abm-piezas.service';
import { PiezaControl } from '../../models/pieza.model';
import { Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GenericModalComponent } from 'app/shared/components/modal/generic-modal.component';

@Component({
  selector: 'app-abm-pieza-controles',
  templateUrl: './abm-pieza-controles.component.html',
  styleUrls: ['./abm-pieza-controles.component.scss']
})
export class ABMPiezaControlesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() override piezaId: number | null = null;
  @Input() override mode: 'create' | 'edit' | 'view' = 'create';

  controlForm!: FormGroup;
  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;
  controles = new MatTableDataSource<PiezaControl>([]);
  sinDatos: boolean = false;
  isLoading: boolean = false;
  editMode: boolean = false;
  controlToEdit: PiezaControl | null = null;
  private subscription: Subscription = new Subscription();

  baseDisplayedColumns: string[] = ['control', 'tipo', 'acciones'];
  displayedColumnsControles: string[] = [];

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected abmPiezaService: ABMPiezaService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private domSanitizer: DomSanitizer
  ) {
    super(fb, router, route, abmPiezaService, dialog);

    this.controlForm = this.fb.group({
      control: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    if (this.piezaId) {
      this.loadControles();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
      if (this.mode === 'view') {
        this.controlForm.disable();
      } else {
        this.controlForm.enable();
      }
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadControles();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setDisplayedColumns(): void {
    this.displayedColumnsControles = this.mode === 'view'
      ? ['control', 'tipo']
      : ['control', 'tipo', 'acciones'];
  }

  loadControles(): void {
    if (!this.piezaId) return;
    this.isLoading = true;
    this.subscription.add(
      this.abmPiezaService.getControlesPorPieza(this.piezaId).subscribe({
        next: (response) => {
          const controlesData = response?.data || [];
          this.controles.data = controlesData;
          this.sinDatos = controlesData.length === 0;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar los controles:', err);
          this.notificationService.showError('Error al cargar los controles.');
          this.isLoading = false;
          this.sinDatos = true;
        }
      })
    );
  }

  addOrUpdateControl(): void {
    if (this.controlForm.invalid) {
      this.notificationService.showError('Por favor, complete el campo del control.');
      return;
    }

    this.isLoading = true;
    const formValue = this.controlForm.value;

    if (!this.piezaId) {
      this.notificationService.showError('ID de pieza no válido.');
      this.isLoading = false;
      return;
    }

    const dto = {
      control: formValue.control,
      idPieza: this.piezaId,
      tipo: 'GENERAL' as const
    };

    if (this.editMode && this.controlToEdit) {
      if (this.controlToEdit.id === null) {
        this.notificationService.showError('ID del control no válido.');
        this.isLoading = false;
        return;
      }
      this.subscription.add(
        this.abmPiezaService.updatePiezaControl(this.controlToEdit.id, dto).subscribe({
          next: () => {
            this.notificationService.showSuccess('Control actualizado correctamente.');
            this.cancelEdit();
            this.loadControles();
          },
          error: (err) => {
            console.error('Error al actualizar el control:', err);
            this.notificationService.showError('Error al actualizar el control.');
            this.isLoading = false;
          }
        })
      );
    } else {
      this.subscription.add(
        this.abmPiezaService.createPiezaControl(dto).subscribe({
          next: () => {
            this.notificationService.showSuccess('Control agregado correctamente.');
            this.formDirective.resetForm();
            this.loadControles();
          },
          error: (err) => {
            console.error('Error al agregar el control:', err);
            this.notificationService.showError('Error al agregar el control.');
            this.isLoading = false;
          }
        })
      );
    }
  }

  eliminarControl(row: PiezaControl): void {
    if (row.id === null) {
      this.notificationService.showError('No se puede eliminar un control sin ID.');
      return;
    }
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el control <span class="font-bold">${row.control}</span>?`);

    const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.subscription.add(
          this.abmPiezaService.deletePiezaControl(row.id!).subscribe({
            next: () => {
              this.notificationService.showSuccess('Control eliminado correctamente.');
              this.loadControles();
            },
            error: (err) => {
              console.error('Error al eliminar el control:', err);
              this.notificationService.showError('Error al eliminar el control.');
              this.isLoading = false;
            }
          })
        );
      }
    });
    this.subscription.add(sub);
  }

  openConfirmationModal(message: SafeHtml): Observable<boolean> {
    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: message,
        showConfirmButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }
    });
    return dialogRef.afterClosed();
  }

  startEdit(piezaControl: PiezaControl): void {
    this.editMode = true;
    this.controlToEdit = { ...piezaControl };
    this.controlForm.setValue({
      control: piezaControl.control
    });
  }

  cancelEdit(): void {
    this.editMode = false;
    this.controlToEdit = null;
    this.formDirective.resetForm();
  }

  get buttonText(): string {
    return this.editMode ? 'Actualizar' : 'Agregar';
  }
}
