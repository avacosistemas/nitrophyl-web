import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesService } from 'app/shared/services/clientes.service';
import { LotService } from 'app/shared/services/lot.service';
import { debounceTime, startWith, map, switchMap, delay } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import * as FileSaver from 'file-saver';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-generar-informes',
  templateUrl: './generar-informes.component.html',
  styleUrls: ['./generar-informes.component.scss'],
})
export class GenerarInformesComponent implements OnInit {
  informesForm: FormGroup;
  clients: { id: number; nombre: string }[] = [];
  clientFilterControl = new FormControl('');
  filteredClients: Observable<{ id: number; nombre: string }[]>;
  lot: { nombre: string; codigo: string }[] = [];
  lotFilterControl = new FormControl('');
  filteredLots: Observable<{ nombre: string; codigo: string }[]>;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private clientsService: ClientesService,
    private lotService: LotService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.informesForm = this.fb.group({
      selectedClient: [null, Validators.required],
      selectedLote: [null, Validators.required],
    });

    this.filteredLots = this.lotFilterControl.valueChanges.pipe(
      debounceTime(300),
      startWith(''),
      delay(0),
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
      map(response => response.data)
    );

    this.getClients();
  }

  getClients(): void {
    this.clientsService.getClientes().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.clients = response.data.map((client: any) => ({
            id: client.id,
            nombre: client.nombre,
          }));
          this.filteredClients = this.clientFilterControl.valueChanges.pipe(
            startWith(''),
            delay(0),
            map(value => this._filterClients(value || ''))
          );
        }
      },
    });
  }

  getLotes(): void {
    this.lotService.getLotes().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.lot = response.data;
          this.filteredLots = this.lotFilterControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterLots(value || ''))
          );
        }
      },
      error: (error) => {
        console.error('Error al obtener los lotes', error);
      },
    });
  }

  onSubmit(): void {
  }

  onEnviarInforme(): void {
    if (this.informesForm.valid) {
      const { idCliente, idLote } = this.getSelectedValues();

      if (idCliente && idLote) {
        this.lotService.getInformeCalidad(idCliente, idLote).subscribe({
          next: () => {
            this.clientFilterControl.setValue('');
            this.lotFilterControl.setValue('');
            this.informesForm.reset();
            this.informesForm.markAsPristine();
            this.openSnackBar('Informe enviado correctamente', 'X', 'green-snackbar');
          },
          error: (error) => {
            console.error('Error al enviar el informe', error);
            this.openSnackBar('Error al enviar el informe', 'X', 'red-snackbar');
          }
        });
      } else {
        this.openSnackBar(
          'Error: No se pudo obtener el ID del cliente o del lote', 'X', 'red-snackbar'
        );
      }
    }
  }

  onDescargarInforme(): void {
    if (this.informesForm.valid) {
      const { idCliente, idLote } = this.getSelectedValues();

      if (idCliente && idLote) {
        this.lotService.getInformeCalidad(idCliente, idLote).subscribe({
          next: (response) => {
            const archivoBase64 = response.data.archivo;
            const nombreArchivo = response.data.nombre;
            const fileExtension = nombreArchivo.split('.').pop()?.toLowerCase();
            const byteString = atob(archivoBase64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([ab], {
              type: fileExtension === 'pdf' ? 'application/pdf' : 'image/' + fileExtension,
            });

            FileSaver.saveAs(blob, nombreArchivo);
          },
          error: (err) => {
            console.error('Error al descargar el informe', err);
          },
        });
      } else {
        this.openSnackBar(
          'Error: No se pudo obtener el ID del cliente o del lote', 'X', 'red-snackbar'
        );
      }
    }
  }

  _displayClientName(client?: { nombre: string }): string | undefined {
    return client ? client.nombre : undefined;
  }

  _displayLotName(lote: { nombre: string; codigo: string }): string {
    return lote && lote.nombre ? lote.nombre : '';
  }

  onClientSelected(event: MatAutocompleteSelectedEvent): void {
    this.informesForm.get('selectedClient')?.setValue(event.option.value);
  }

  onLotSelected(event: MatAutocompleteSelectedEvent): void {
    this.informesForm.get('selectedLote')?.setValue(event.option.value);
  }

  openSnackBar(message: string, action: string, className: string): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: className,
    });
  }

  private _normalizeValue(value: string | { nombre: string }): string {
    if (typeof value === 'string') {
      return value.toLowerCase().replace(/\s/g, '');
    } else if (typeof value === 'object' && value !== null && 'nombre' in value) {
      return value.nombre.toLowerCase().replace(/\s/g, '');
    } else {
      return '';
    }
  }

  private _filterLots(value: string): { nombre: string; codigo: string }[] {
    const filterValue = this._normalizeValue(value);
    return this.lot.filter(lote =>
      this._normalizeValue(lote.nombre).includes(filterValue)
    );
  }

  private _filterClients(
    value: string | { id: number; nombre: string }
  ): { id: number; nombre: string }[] {
    const filterValue = this._normalizeValue(value);

    return this.clients.filter((client) => {
      if (typeof value === 'object' && value !== null) {
        return this._normalizeValue(client.nombre).includes(
          this._normalizeValue(value.nombre)
        );
      } else {
        return this._normalizeValue(client.nombre).includes(filterValue);
      }
    });
  }

  private getSelectedValues(): { idCliente: number | null; idLote: string | null } {
    const { id: idCliente } = this.informesForm.get('selectedClient')?.value || {};
    const { codigo: idLote } = this.informesForm.get('selectedLote')?.value || {};
    return { idCliente, idLote };
  }
}
