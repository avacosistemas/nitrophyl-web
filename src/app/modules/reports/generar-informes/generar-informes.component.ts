import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ClientesService } from 'app/shared/services/clientes.service';
import { LotService } from 'app/shared/services/lot.service';
import { debounceTime, startWith, map, switchMap, delay, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { HttpErrorResponse } from '@angular/common/http';
import { SafeResourceUrl } from '@angular/platform-browser';
import { PDFModalDialogComponent } from 'app/modules/prompts/pdf-modal/pdf-modal.component';
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
  clients: { id: number; nombre: string; email: string; codigo?: string }[] = [];
  clientFilterControl = new FormControl('');
  filteredClients: Observable<{ id: number; nombre: string; email: string; codigo?: string }[]>;
  lot: { nombre: string; id: string }[] = [];
  lotFilterControl = new FormControl('');
  filteredLots: Observable<{ nombre: string; id: string }[]>;
  errorMessage: string = '';
  errorList: string[] = [];
  showErrorAlert: boolean = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  selectedLotDetails: IInformeLoteData | null = null;

  isSending: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private clientsService: ClientesService,
    private lotService: LotService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.informesForm = this.fb.group({
      selectedClient: [null, Validators.required],
      selectedLote: [null, Validators.required],
      observacionesInforme: [''],
    });

    this.filteredLots = this.lotFilterControl.valueChanges.pipe(
      debounceTime(300),
      startWith(''),
      switchMap((value) => {
        if (typeof value === 'string' && value.length > 0) {
          return this.lotService.getLotesByNroLote(value);
        } else if (typeof value === 'object' && value !== null && 'nombre' in value) {
          return this.lotService.getLotesByNroLote(value.nombre);
        } else {
          this.informesForm.get('selectedLote')?.setValue(null);
          return of({ status: 'OK', data: [] });
        }
      }),
      map(response => response.data.map((lot: any) => ({
        nombre: lot.nombre,
        id: lot.codigo,
      }))),
      takeUntil(this.destroy$)
    );

    this.getClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getClients(): void {
    this.clientsService.getClientes().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.clients = response.data.map((client: any) => ({
            id: client.id,
            nombre: client.nombre,
            email: client.email,
            codigo: client.codigo
          }));
          this.filteredClients = this.clientFilterControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterClients(value || '')),
            takeUntil(this.destroy$)
          );
        }
      },
      error: (error) => {
        console.error('Error al obtener los clientes', error);
        this.notificationService.showError('Error al obtener los clientes.');
      }
    });
  }

  getLotes(): void {
    this.lotService.getLotes().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.lot = response.data.map((lot: any) => ({
            nombre: lot.nombre,
            id: lot.codigo,
          }));;
          this.filteredLots = this.lotFilterControl.valueChanges.pipe(
            startWith(''),
            switchMap(value => this._filterLots(value || '')),
            takeUntil(this.destroy$)
          );
        }
      },
      error: (error) => {
        console.error('Error al obtener los lotes', error);
        this.notificationService.showError('Error al obtener los lotes.');
      }
    });
  }

  onSubmit(): void {
  }

  openConfirmSendEmailDialog(idCliente: number, idLote: string, email: string, observacionesInforme: string): void {
    this.isSending = true;
    const dialogRef = this.dialog.open(ConfirmSendEmailDialogComponent, {
      width: '600px',
      data: { idCliente: idCliente, idLote: idLote, email: email, observacionesInforme: observacionesInforme }
    });

    dialogRef.beforeClosed().subscribe(() => {
      this.isSending = false;
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isSending = false;

      if (result && result.result === 'success') {
        this.clearClientInput();
        this.clearLotInput();
        this.informesForm.reset();
        this.informesForm.markAsPristine();
        this.notificationService.showSuccess('Informe enviado correctamente.');
      }
    });
  }

  onEnviarInforme(): void {
    if (this.informesForm.valid) {
      const { idCliente, idLote } = this.getSelectedValues();
      const observacionesInforme = this.informesForm.get('observacionesInforme').value;

      if (idCliente && idLote) {
        this.clientsService.getCorreoInforme(idCliente).subscribe({
          next: (response) => {
            if (response && response.data) {
              const correo = response.data;
              this.openConfirmSendEmailDialog(idCliente, idLote, correo, observacionesInforme);
            } else {
              this.errorMessage = 'Error: No se pudo obtener el correo electrónico del cliente';
              this.showErrorAlert = true;
              this.notificationService.showError('Error al obtener el correo electrónico del cliente.');
            }
          },
          error: (errorResponse: HttpErrorResponse) => {
            console.error('Error al obtener el correo electrónico del cliente', errorResponse);

            if (errorResponse.error && errorResponse.error.message) {
              this.errorMessage = errorResponse.error.message;
              this.showErrorAlert = true;
              this.notificationService.showError(errorResponse.error.message);
            } else {
              this.errorMessage = 'Error al obtener el correo electrónico del cliente';
              this.showErrorAlert = true;
              this.notificationService.showError('Error al obtener el correo electrónico del cliente.');
            }
          }
        });
      } else {
        this.errorMessage = 'Error: No se pudo obtener el ID del cliente o del lote';
        this.showErrorAlert = true;
        this.notificationService.showError('Error: No se pudo obtener el ID del cliente o del lote.');
      }
    }
  }

  onVistaPreviaInforme(): void {
    if (this.informesForm.valid) {
      const { idCliente, idLote } = this.getSelectedValues();
      const observacionesInforme = this.informesForm.get('observacionesInforme').value;

      if (idCliente && idLote) {
        this.lotService.getInformeCalidad(idCliente, idLote, observacionesInforme).subscribe({
          next: (response) => {
            if (response && response.data && response.data.archivo && response.data.nombre) {
              const archivoBase64 = response.data.archivo;
              const nombreArchivo = response.data.nombre;

              this.dialog.open(PDFModalDialogComponent, {
                maxWidth: '90%',
                width: '860px',
                data: {
                  src: archivoBase64,
                  title: nombreArchivo,
                  showDownloadButton: true
                },
              });

              this.closeError();
            } else {
              this.errorMessage = 'Respuesta inesperada del servidor.';
              this.errorList = [];
              this.showErrorAlert = true;
            }
          },
          error: (err: any) => {
            console.error('Error al obtener el informe para la vista previa', err);
            this.handleError(err);
          },
        });
      } else {
        this.notificationService.showError('Error: No se pudo obtener el ID del cliente o del lote.');
      }
    }
  }

  _displayClientName(client?: { nombre: string }): string | undefined {
    return client ? client.nombre : undefined;
  }

  _displayLotName(lote?: { nombre: string }): string | undefined {
    return lote ? lote.nombre : undefined;
  }

  onClientSelected(event: MatAutocompleteSelectedEvent): void {
    this.informesForm.get('selectedClient')?.setValue(event.option.value);
  }

  onLotSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedLot = event.option.value;
    this.informesForm.get('selectedLote')?.setValue(selectedLot);

    this.lotService.getInformeLote(selectedLot.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response && response.data && response.data.body && response.data.body.data) {
          this.selectedLotDetails = response.data.body.data;
        } else {
          this.selectedLotDetails = null;
        }
      });
  }

  clearClientInput(): void {
    this.clientFilterControl.setValue('');
    this.informesForm.get('selectedClient')?.setValue(null);
    this.clientInput.nativeElement.value = '';
  }

  clearLotInput(): void {
    this.lotFilterControl.setValue('');
    this.informesForm.get('selectedLote')?.setValue(null);
    this.lotInput.nativeElement.value = '';
    this.selectedLotDetails = null;
  }

  closeError(): void {
    this.showErrorAlert = false;
    this.errorMessage = '';
    this.errorList = [];
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  private handleError(error: any): void {
    this.errorMessage = 'Hubo un error en la petición.';
    this.errorList = [];
    this.showErrorAlert = true;
    if (error instanceof HttpErrorResponse) {
      if (error.error) {
        if (error.error.message) {
          this.errorMessage = error.error.message;
        }
        if (error.error.errors) {
          this.errorList = Object.values(error.error.errors);
        }
        if (error.error.status === 'VALIDATIONS_ERRORS') {
          this.errorMessage = error.error.message || 'Ocurrió un error.';
          this.errorList = Object.entries(error.error.errors || {}).map(([key, value]) => `${key}: ${value}`);
        }
      } else {
        this.errorMessage = `Error en la petición: ${error.message}`;
      }
    } else {
      this.errorMessage = `Error inesperado: ${error}`;
    }
  }

  private _filterLots(value: string | any): Observable<{ nombre: string; id: string }[]> {
    const filterValue = (typeof value === 'string' ? value : value.nombre).toLowerCase();
    return of(this.lot.filter(lote =>
      lote.nombre.toLowerCase().includes(filterValue)
    ));
  }

  private _filterClients(value: string | any): { id: number; nombre: string; email: string; codigo?: string }[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    if (!filterValue) {
      return this.clients;
    }

    return this.clients.filter(client =>
      client.nombre.toLowerCase().includes(filterValue) ||
      (client.codigo && client.codigo.toLowerCase().includes(filterValue))
    );
  }

  private getSelectedValues(): { idCliente: number | null; idLote: string | null } {
    const { id: idCliente } = this.informesForm.get('selectedClient')?.value || {};
    const { id: idLote } = this.informesForm.get('selectedLote')?.value || {};
    return { idCliente, idLote };
  }
}