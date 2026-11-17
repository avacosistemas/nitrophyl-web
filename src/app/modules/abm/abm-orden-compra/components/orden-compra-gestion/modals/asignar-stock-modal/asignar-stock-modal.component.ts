import { Component, Input, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LotService } from 'app/modules/abm/abm-lots/lot.service';
import { NotificationService } from 'app/shared/services/notification.service';

export interface ILoteItem {
    id?: number;
    nombre: string;
    codigo?: string;
    cantidadDisponible: number;
}

export interface ILoteAsignadoItem {
    idLote?: number;
    lote: string;
    disponible: number;
    cantidadAsignada: number;
}

@Component({
    selector: 'app-asignar-stock-modal',
    templateUrl: './asignar-stock-modal.component.html'
})
export class AsignarStockModalComponent implements OnInit, OnDestroy {
    @Input() item: any;
    @ViewChild('loteTrigger', { read: MatAutocompleteTrigger }) loteTrigger?: MatAutocompleteTrigger;

    isLoading = false;
    loteCtrl = new FormControl('');
    cantidadCtrl = new FormControl(null, [Validators.min(1)]);

    allLotes: ILoteItem[] = [];
    filteredLotes: ILoteItem[] = [];
    selectedLote: ILoteItem | null = null;

    lotesAsignados: ILoteAsignadoItem[] = [];
    displayedColumns: string[] = ['lote', 'disponible', 'cantidadAsignada', 'acciones'];

    private _destroy$ = new Subject<void>();

    constructor(
        private _lotService: LotService,
        private _notification: NotificationService,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadLotes();
        this.setupFilter();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    loadLotes(): void {
        this.isLoading = true;
        this._lotService.getLotes().pipe(takeUntil(this._destroy$)).subscribe({
            next: (res) => {
                this.isLoading = false;
                const data = res?.data || [];
                if (Array.isArray(data) && data.length > 0) {
                    this.allLotes = data.map((l: any, idx: number) => ({
                        id: l.id || idx + 1,
                        nombre: l.nombre || l.codigo || `LOTE-${idx + 1}`,
                        codigo: l.codigo || l.nombre,
                        cantidadDisponible: (l as any).cantidad || (l as any).stockFisico || 50
                    }));
                } else {
                    this.allLotes = [
                        { id: 1, nombre: 'C3434', codigo: 'C3434', cantidadDisponible: 50 },
                        { id: 2, nombre: 'L1264', codigo: 'L1264', cantidadDisponible: 50 },
                        { id: 3, nombre: 'L2301', codigo: 'L2301', cantidadDisponible: 50 },
                        { id: 4, nombre: 'L3068', codigo: 'L3068', cantidadDisponible: 50 },
                        { id: 5, nombre: 'L3378', codigo: 'L3378', cantidadDisponible: 50 },
                        { id: 6, nombre: 'L3574', codigo: 'L3574', cantidadDisponible: 50 },
                        { id: 7, nombre: 'M0001', codigo: 'M0001', cantidadDisponible: 50 }
                    ];
                }
                this.filterLotes('');
                this._cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.allLotes = [
                    { id: 1, nombre: 'C3434', codigo: 'C3434', cantidadDisponible: 50 },
                    { id: 2, nombre: 'L1264', codigo: 'L1264', cantidadDisponible: 50 },
                    { id: 3, nombre: 'L2301', codigo: 'L2301', cantidadDisponible: 50 }
                ];
                this.filterLotes('');
                this._cdr.detectChanges();
            }
        });
    }

    private setupFilter(): void {
        this.loteCtrl.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(val => {
            const query = typeof val === 'string' ? val : (val?.nombre || '');
            this.filterLotes(query);
            if (typeof val === 'string' && (!this.selectedLote || this.selectedLote.nombre !== val)) {
                this.selectedLote = null;
            }
        });
    }

    private filterLotes(search: string): void {
        const term = (search || '').trim().toLowerCase();
        if (!term) {
            this.filteredLotes = this.allLotes.slice(0, 50);
        } else {
            this.filteredLotes = this.allLotes
                .filter(l => (l.nombre && l.nombre.toLowerCase().includes(term)) || (l.codigo && l.codigo.toLowerCase().includes(term)))
                .slice(0, 50);
        }
    }

    displayLote(lote: ILoteItem): string {
        return lote ? (lote.nombre || lote.codigo || '') : '';
    }

    onLoteSelected(event: MatAutocompleteSelectedEvent): void {
        this.selectedLote = event.option.value;
        if (this.selectedLote && (!this.cantidadCtrl.value || this.cantidadCtrl.value <= 0)) {
            this.cantidadCtrl.setValue(1);
        }
    }

    clearLoteSelection(): void {
        this.loteCtrl.setValue('');
        this.selectedLote = null;
        this.cantidadCtrl.setValue(null);
    }

    openLotePanel(): void {
        if (this.loteTrigger) {
            this.loteTrigger.openPanel();
        }
    }

    canAddLote(): boolean {
        const cant = Number(this.cantidadCtrl.value);
        return !!this.selectedLote && cant > 0 && cant <= this.selectedLote.cantidadDisponible;
    }

    agregarLoteAsignado(): void {
        if (!this.selectedLote) return;
        const cant = Number(this.cantidadCtrl.value);
        if (cant <= 0) {
            this._notification.showError('La cantidad debe ser mayor a 0');
            return;
        }
        if (cant > this.selectedLote.cantidadDisponible) {
            this._notification.showError(`La cantidad supera el disponible (${this.selectedLote.cantidadDisponible})`);
            return;
        }

        const existing = this.lotesAsignados.find(l => l.lote === this.selectedLote!.nombre);
        if (existing) {
            if (existing.cantidadAsignada + cant > this.selectedLote.cantidadDisponible) {
                this._notification.showError(`El total para este lote superaría el disponible (${this.selectedLote.cantidadDisponible})`);
                return;
            }
            existing.cantidadAsignada += cant;
        } else {
            this.lotesAsignados.push({
                idLote: this.selectedLote.id,
                lote: this.selectedLote.nombre,
                disponible: this.selectedLote.cantidadDisponible,
                cantidadAsignada: cant
            });
        }

        this.lotesAsignados = [...this.lotesAsignados];
        this.clearLoteSelection();
        this._cdr.detectChanges();
    }

    quitarLoteAsignado(index: number): void {
        this.lotesAsignados.splice(index, 1);
        this.lotesAsignados = [...this.lotesAsignados];
        this._cdr.detectChanges();
    }

    getTotalAsignado(): number {
        return this.lotesAsignados.reduce((acc, curr) => acc + curr.cantidadAsignada, 0);
    }

    getValue(): any {
        if (this.lotesAsignados.length === 0) {
            return null;
        }

        return {
            item: this.item,
            asignaciones: this.lotesAsignados,
            totalAsignado: this.getTotalAsignado()
        };
    }
}
