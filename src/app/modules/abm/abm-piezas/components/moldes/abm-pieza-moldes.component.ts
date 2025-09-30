import { Component, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from 'app/shared/services/notification.service';
import { ABMPiezaService } from '../../abm-piezas.service';
import { Observable, Subscription, of, BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ABMPiezaBaseComponent } from '../abm-pieza-base.component';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { startWith, map, debounceTime, switchMap, catchError } from 'rxjs/operators';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { Molde, IPiezaMolde, PiezaProceso } from '../../models/pieza.model';

@Component({
  selector: 'app-abm-pieza-moldes',
  templateUrl: './abm-pieza-moldes.component.html',
  styleUrls: ['./abm-pieza-moldes.component.scss']
})
export class ABMPiezaMoldesComponent extends ABMPiezaBaseComponent implements OnInit, OnDestroy, OnChanges {
  @Input() piezaId: number;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() piezaProcesoData: PiezaProceso | null = null;

  moldesAsociados = new MatTableDataSource<IPiezaMolde>([]);
  sinDatos: boolean = false;
  isLoading: boolean = false;

  baseDisplayedColumns: string[] = ['nombre', 'observaciones'];
  displayedColumnsMoldes: string[];

  filteredMoldes$: Observable<Molde[]>;
  moldeForm: FormGroup;

  private subscription: Subscription = new Subscription();
  private idTipoPieza$ = new BehaviorSubject<number | null>(null);
  private allTiposPieza: { id: number; nombre: string; }[] = [];

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
    this.moldeForm = this.fb.group({
      molde: [null, Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.setDisplayedColumns();
    if (this.piezaId) {
      this.loadMoldesAsociados();
    }

    this.subscription.add(
      this.abmPiezaService.getPiezaTipo().subscribe(tipos => {
        this.allTiposPieza = tipos;
        if (this.piezaProcesoData && this.piezaProcesoData.tipo) {
          const tipo = this.allTiposPieza.find(t => t.nombre === this.piezaProcesoData.tipo);
          this.idTipoPieza$.next(tipo ? tipo.id : null);
        }
      })
    );

    this.filteredMoldes$ = this.idTipoPieza$.pipe(
      switchMap(idTipoPieza => {
        if (!idTipoPieza) {
          return of([]);
        }

        return this.moldeForm.get('molde').valueChanges.pipe(
          startWith(''),
          debounceTime(300),
          switchMap(value => {
            const searchTerm = typeof value === 'string' ? value : '';
            return this.abmPiezaService.getMoldesCombo(searchTerm, idTipoPieza).pipe(
              map(response => response.data || []),
              catchError(() => of([]))
            );
          })
        );
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode) {
      this.setDisplayedColumns();
      if (this.mode === 'view') {
        this.moldeForm.disable();
      } else {
        this.moldeForm.enable();
      }
    }
    if (changes.piezaId && changes.piezaId.currentValue) {
      this.loadMoldesAsociados();
    }
    if (changes.piezaProcesoData && changes.piezaProcesoData.currentValue) {
      if (this.allTiposPieza.length > 0) {
        const tipo = this.allTiposPieza.find(t => t.nombre === changes.piezaProcesoData.currentValue.tipo);
        this.idTipoPieza$.next(tipo ? tipo.id : null);
      }
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy(); 
    this.subscription.unsubscribe();
  }
  
  setDisplayedColumns(): void {
    this.displayedColumnsMoldes = this.mode === 'view'
      ? this.baseDisplayedColumns
      : [...this.baseDisplayedColumns, 'acciones'];
  }

  loadMoldesAsociados(): void {
    if (!this.piezaId) return;

    this.isLoading = true;
    this.subscription.add(
      this.abmPiezaService.getPiezaMoldes(this.piezaId).subscribe({
        next: (response) => {
          this.moldesAsociados.data = response.data || [];
          this.sinDatos = (response.data || []).length === 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.notificationService.showError('Error al cargar los moldes asociados.');
          console.error(err);
          this.isLoading = false;
          this.sinDatos = true;
        }
      })
    );
  }

  addMolde(): void {
    if (this.moldeForm.invalid) {
      this.notificationService.showError('Por favor, seleccione un molde de la lista.');
      return;
    }

    const selectedMolde = this.moldeForm.get('molde').value as Molde;
    if (!selectedMolde || typeof selectedMolde !== 'object' || !selectedMolde.id) {
      this.notificationService.showError('Selección de molde inválida. Por favor, elija una opción de la lista.');
      return;
    }

    const dto = {
      idMolde: selectedMolde.id,
      idPieza: this.piezaId,
      observaciones: this.moldeForm.get('observaciones').value || null
    };

    this.isLoading = true;
    this.subscription.add(
      this.abmPiezaService.addPiezaMolde(dto).subscribe({
        next: () => {
          this.notificationService.showSuccess('Molde agregado correctamente.');
          this.moldeForm.reset();
          this.loadMoldesAsociados();
        },
        error: (err) => {
          this.notificationService.showError('Error al agregar el molde.');
          console.error(err);
          this.isLoading = false;
        }
      })
    );
  }

  eliminarMolde(piezaMolde: IPiezaMolde): void {
    const mensaje = this.domSanitizer.bypassSecurityTrustHtml(`¿Estás seguro de que quieres eliminar el molde <span class="font-bold">${piezaMolde.codigo}</span>?`);

    const sub = this.openConfirmationModal(mensaje).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.subscription.add(
          this.abmPiezaService.deletePiezaMolde(piezaMolde.id).subscribe({
            next: () => {
              this.notificationService.showSuccess('Molde eliminado correctamente.');
              this.loadMoldesAsociados();
            },
            error: (err) => {
              this.notificationService.showError('Error al eliminar el molde.');
              console.error(err);
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

  clearMolde(): void {
    this.moldeForm.get('molde').reset();
  }

  displayFn(molde: Molde): string {
    return molde && molde.nombre ? molde.nombre : '';
  }
}