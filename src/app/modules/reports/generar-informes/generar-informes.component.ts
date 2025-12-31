import { Component, OnInit, ElementRef, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ClientesService } from 'app/shared/services/clientes.service';
import { LotService } from 'app/shared/services/lot.service';
import { debounceTime, startWith, catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject, forkJoin, throwError } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { HttpErrorResponse } from '@angular/common/http';
import { PDFModalComponent } from './pdf-modal/pdf-modal.component';
import { IInformeLoteData } from 'app/shared/models/lot.interface';
import { ConfirmSendEmailDialogComponent } from '../confirm-send-email-dialog/confirm-send-email-dialog.component';
import { NotificationService } from 'app/shared/services/notification.service';

@Component({
  selector: 'app-generar-informes',
  templateUrl: './generar-informes.component.html',
  styleUrls: ['./generar-informes.component.scss'],
})
export class GenerarInformesComponent implements OnInit, OnDestroy {
  @ViewChild('clientInput') clientInput: ElementRef<HTMLInputElement>;
  @ViewChild('lotInput') lotInput: ElementRef<HTMLInputElement>;

  informesForm: FormGroup;
  clientFilterControl = new FormControl('');
  filteredClients: Observable<any[]>;
  clients: any[] = [];

  lotFilterControl = new FormControl('');
  filteredLots: Observable<any[]>;

  dataSource = new MatTableDataSource<IInformeLoteData>([]);
  displayedColumns: string[] = ['nroLote', 'fecha', 'grado', 'material', 'acciones'];

  errorMessage: string = '';
  errorList: string[] = [];
  showErrorAlert: boolean = false;
  isSending: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private clientsService: ClientesService,
    private lotService: LotService,
    private notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.informesForm = this.fb.group({
      selectedClient: [null, Validators.required],
      observacionesInforme: [''],
    });

    this.setupFilters();
    this.getClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    this.filteredLots = this.lotFilterControl.valueChanges.pipe(
      debounceTime(300),
      startWith(''),
      switchMap((value) => {
        const term = typeof value === 'string' ? value : value?.nombre;
        if (term && term.length > 0) {
          return this.lotService.getLotesByNroLote(term);
        }
        return of({ status: 'OK', data: [] });
      }),
      map(response => response.data.map((lot: any) => ({
        nombre: lot.nombre,
        id: lot.codigo,
      }))),
      takeUntil(this.destroy$)
    );
  }

  getClients(): void {
    this.clientsService.getClientes().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.clients = response.data;
          this.filteredClients = this.clientFilterControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterClients(value || '')),
            takeUntil(this.destroy$)
          );
        }
      }
    });
  }

  onLotSelected(event: MatAutocompleteSelectedEvent): void {
    const lotBasicInfo = event.option.value;

    if (this.dataSource.data.find(l => l.id.toString() === lotBasicInfo.id.toString())) {
      this.notificationService.showError('Este lote ya ha sido añadido.');
      this.clearLotSearch();
      return;
    }

    this.lotService.getInformeLote(lotBasicInfo.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response && response.data) {
          const newData = [...this.dataSource.data, response.data];
          this.dataSource.data = newData;

          this.clearLotSearch();
          this.cdRef.detectChanges();
        }
      });
  }

  removeLot(id: number): void {
    this.dataSource.data = this.dataSource.data.filter(l => l.id !== id);
    this.cdRef.detectChanges();
  }

  private clearLotSearch(): void {
    this.lotFilterControl.setValue('');
    if (this.lotInput) {
      this.lotInput.nativeElement.value = '';
    }
  }

  onEnviarInforme(): void {
    if (this.informesForm.valid && this.dataSource.data.length > 0) {
      this.isSending = true;
      const idCliente = this.informesForm.get('selectedClient').value.id;
      const idLotes = this.dataSource.data.map(l => l.id).join(',');
      const observacionesInforme = this.informesForm.get('observacionesInforme').value;

      this.clientsService.getCorreoInforme(idCliente).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.openConfirmSendEmailDialog(idCliente, idLotes, response.data, observacionesInforme);
          } else {
            this.notificationService.showError('No se pudo obtener el correo del cliente');
            this.isSending = false;
          }
        },
        error: (err) => {
          this.handleError(err);
          this.isSending = false;
        }
      });
    }
  }

  onVistaPreviaInforme(): void {
    const idCliente = this.informesForm.get('selectedClient').value?.id;
    const lotesSeleccionados = this.dataSource.data;
    const observacionesInforme = this.informesForm.get('observacionesInforme').value;

    if (idCliente && lotesSeleccionados.length > 0) {
      this.isSending = true;
      this.closeError();

      const peticiones = lotesSeleccionados.map(lote =>
        this.lotService.getInformeCalidad(idCliente, lote.id.toString(), observacionesInforme).pipe(
          catchError(err => {
            err.loteError = lote.nroLote;
            return throwError(() => err);
          })
        )
      );

      forkJoin(peticiones).subscribe({
        next: (responses: any[]) => {
          this.isSending = false;
          const informesParaModal = responses.map((res, index) => ({
            src: res.data.archivo,
            title: res.data.nombre,
            nroLote: lotesSeleccionados[index].nroLote
          }));

          this.dialog.open(PDFModalComponent, {
            maxWidth: '95vw', width: '1000px',
            data: { informes: informesParaModal, showDownloadButton: true },
          });
        },
        error: (err) => {
          this.isSending = false;
          this.handleError(err);
        }
      });
    }
  }

  private handleError(error: any): void {
    this.showErrorAlert = true;
    this.errorList = [];

    const nombreLote = error.loteError ? `[Lote ${error.loteError}] ` : '';

    if (error instanceof HttpErrorResponse) {
      const errorData = error.error;

      if (errorData) {
        this.errorMessage = `${nombreLote}${errorData.message || 'Error de validación.'}`;

        if (errorData.errors && typeof errorData.errors === 'object') {
          this.errorList = Object.entries(errorData.errors).map(
            ([campo, mensaje]) => `${campo}: ${mensaje}`
          );
        }
      } else {
        this.errorMessage = `${nombreLote}${error.message}`;
      }
    } else {
      this.errorMessage = 'Error inesperado al generar los informes.';
    }

    this.cdRef.detectChanges();

    setTimeout(() => {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  openConfirmSendEmailDialog(idCliente: number, idLote: string, email: string, observacionesInforme: string): void {
    const dialogRef = this.dialog.open(ConfirmSendEmailDialogComponent, {
      width: '600px',
      data: { idCliente, idLote, email, observacionesInforme }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isSending = false;
      if (result?.result === 'success') {
        this.resetPage();
      }
    });
  }

  resetPage(): void {
    this.dataSource.data = [];
    this.informesForm.reset();
    this.clientFilterControl.setValue('');
    this.notificationService.showSuccess('Informes enviados correctamente.');
  }

  _displayClientName(client?: any): string { return client ? client.nombre : ''; }
  _displayLotName(lote?: any): string { return lote ? lote.nombre : ''; }

  onClientSelected(event: MatAutocompleteSelectedEvent): void {
    this.informesForm.get('selectedClient')?.setValue(event.option.value);
  }

  clearClientInput(): void {
    this.clientFilterControl.setValue('');
    this.informesForm.get('selectedClient')?.setValue(null);
    this.clientInput.nativeElement.value = '';
  }

  closeError(): void {
    this.showErrorAlert = false;
    this.errorMessage = '';
    this.errorList = [];
  }

  private _filterClients(value: string | any): any[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    return this.clients.filter(c =>
      c.nombre.toLowerCase().includes(filterValue) ||
      (c.codigo && c.codigo.toLowerCase().includes(filterValue))
    );
  }
}