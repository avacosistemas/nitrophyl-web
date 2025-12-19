import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'app/shared/services/notification.service';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';
import { AbmOrdenCompraService } from '../../abm-orden-compra.service';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Cliente } from 'app/shared/models/cliente.model';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import * as moment from 'moment';

@Component({
    selector: 'app-orden-compra-modal',
    templateUrl: './orden-compra-modal.component.html',
})
export class OrdenCompraModalComponent implements OnInit, OnDestroy {
    @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) clienteAutocompleteTrigger: MatAutocompleteTrigger;

    form: FormGroup;
    isLoading = false;
    isDragging = false;
    isEditMode = false;
    title: string = 'Crear Orden de Compra';
    clientes: Cliente[] = [];
    filteredClientes$: Observable<Cliente[]>;
    selectedFile: File | null = null;
    private _destroying$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<OrdenCompraModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder,
        private _ordenCompraService: AbmOrdenCompraService,
        private _clientesService: ClientesService,
        private _notificationService: NotificationService,
        private _cdr: ChangeDetectorRef
    ) {
        this.isEditMode = !!(this.data && this.data.ordenCompra);
        if (this.isEditMode) {
            this.title = 'Editar Orden de Compra';
        }

        this.form = this.fb.group({
            cliente: [null, Validators.required],
            fecha: [new Date(), Validators.required],
            nroComprobante: ['', [Validators.required, Validators.maxLength(50)]],
            nroInterno: ['', [Validators.required, Validators.maxLength(50)]],
            archivo: [null]
        });
    }

    ngOnInit(): void {
        this.loadClientes();
    }

    ngOnDestroy(): void {
        this._destroying$.next();
        this._destroying$.complete();
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this._handleFileSelection(files[0]);
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this._handleFileSelection(input.files[0]);
        }
    }

    private _handleFileSelection(file: File): void {
        if (file.type !== 'application/pdf') {
            this._notificationService.showError('Solo se permiten archivos en formato PDF.');
            this.removeFile();
            return;
        }

        this.selectedFile = file;
        this.form.patchValue({ archivo: file });
        this._cdr.markForCheck();
    }

    removeFile(): void {
        this.selectedFile = null;
        this.form.patchValue({ archivo: null });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isLoading = true;

        const processAndSave = (fileContent: string | null) => {
            const formValue = this.form.getRawValue();
            const dto = {
                idCliente: formValue.cliente.id,
                clienteNombre: formValue.cliente.nombre,
                fecha: moment(formValue.fecha).format('DD/MM/YYYY'),
                nroComprobante: formValue.nroComprobante,
                nroInterno: formValue.nroInterno,
                archivoNombre: this.selectedFile?.name,
                archivoContenido: fileContent,
            };

            this._ordenCompraService.createOrdenCompra(dto).subscribe({
                next: () => {
                    this.isLoading = false;
                    this._notificationService.showSuccess('Orden de compra guardada correctamente.');
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error(err);
                    this._notificationService.showError('Ocurrió un error al guardar.');
                }
            });
        };

        if (this.selectedFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                processAndSave(base64String);
            };
            reader.readAsDataURL(this.selectedFile);
        } else {
            processAndSave(null);
        }
    }

    loadClientes(): void {
        this._clientesService.getClientes().pipe(takeUntil(this._destroying$)).subscribe({
            next: (res) => {
                this.clientes = res.data || [];
                this.filteredClientes$ = this.form.get('cliente').valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterClientes(value))
                );
            },
            error: () => this._notificationService.showError('Error al cargar clientes.')
        });
    }

    private _filterClientes(value: string | Cliente): Cliente[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.clientes.filter(cliente =>
            cliente.nombre.toLowerCase().includes(filterValue) ||
            (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
        );
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    displayFn(cliente: Cliente): string {
        return cliente?.nombre || '';
    }

    clearClientSelection(): void {
        this.form.get('cliente').setValue('');
        this._cdr.detectChanges();
        setTimeout(() => {
            if (this.clienteAutocompleteTrigger) {
                this.clienteAutocompleteTrigger.openPanel();
            }
        }, 50);
    }
}