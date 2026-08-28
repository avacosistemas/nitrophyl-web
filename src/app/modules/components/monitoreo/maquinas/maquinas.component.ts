import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';

import { MonitoreoService, MaquinaMonitoreo } from '../monitoreo.service';
import { DetalleOtDialogComponent } from '../dialogs/detalle-ot-dialog/detalle-ot-dialog.component';

@Component({
    selector: 'app-maquinas-monitoreo',
    templateUrl: './maquinas.component.html',
    styleUrls: []
})
export class MaquinasComponent implements OnInit, OnDestroy {
    isLoading = true;
    errorLoading = false;

    allMaquinas: MaquinaMonitoreo[] = [];
    filteredMaquinas: MaquinaMonitoreo[] = [];

    tiposMaquinaList: string[] = [];
    sectoresList: string[] = [];

    filteredTiposMaquina$!: Observable<string[]>;
    filteredSectores$!: Observable<string[]>;

    coloresOptions = [
        { value: 'GRIS', label: 'Gris (Sin carga - 0 OTs)', colorClass: 'bg-gray-400' },
        { value: 'AMARILLO', label: 'Amarillo (Carga baja - 1 a 2 OTs)', colorClass: 'bg-yellow-400' },
        { value: 'NARANJA', label: 'Naranja (Carga media - 3 a 5 OTs)', colorClass: 'bg-orange-500' },
        { value: 'ROJO', label: 'Rojo (Carga alta - 6 o más OTs)', colorClass: 'bg-red-500' }
    ];

    filterForm: FormGroup;

    private _destroying$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private monitoreoService: MonitoreoService,
        private dialog: MatDialog
    ) {
        this.filterForm = this.fb.group({
            tipoMaquina: [''],
            sector: [''],
            cargaColor: ['']
        });
    }

    ngOnInit(): void {
        this.setupAutocompleteObservables();
        this.loadMaquinaData();
    }

    ngOnDestroy(): void {
        this._destroying$.next();
        this._destroying$.complete();
    }

    handleAction(action: string): void {
        if (action === 'refresh') {
            this.loadMaquinaData();
        }
    }

    private setupAutocompleteObservables(): void {
        this.filteredTiposMaquina$ = this.filterForm.get('tipoMaquina')!.valueChanges.pipe(
            startWith(''),
            map(val => this.filterOptionsList(this.tiposMaquinaList, val))
        );

        this.filteredSectores$ = this.filterForm.get('sector')!.valueChanges.pipe(
            startWith(''),
            map(val => this.filterOptionsList(this.sectoresList, val))
        );
    }

    private filterOptionsList(options: string[], val: any): string[] {
        const filterVal = typeof val === 'string' ? val.toLowerCase().trim() : '';
        if (!filterVal) {
            return options;
        }
        return options.filter(opt => opt.toLowerCase().includes(filterVal));
    }

    loadMaquinaData(): void {
        this.isLoading = true;
        this.errorLoading = false;

        this.monitoreoService.getMaquinasMonitoreo().pipe(
            takeUntil(this._destroying$)
        ).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 'OK' && Array.isArray(response.data)) {
                    this.allMaquinas = response.data;
                    this.extractUniqueFilterOptions(response.data);
                    this.applyFilters();
                } else {
                    this.errorLoading = true;
                }
            },
            error: () => {
                this.isLoading = false;
                this.errorLoading = true;
            }
        });
    }

    private extractUniqueFilterOptions(data: MaquinaMonitoreo[]): void {
        const machineNamesSet = new Set<string>();
        const sectorsSet = new Set<string>();

        data.forEach(item => {
            if (item.maquina) machineNamesSet.add(item.maquina);
            if (item.tipoMaquina) machineNamesSet.add(item.tipoMaquina);
            if (item.sector) sectorsSet.add(item.sector);
        });

        this.tiposMaquinaList = Array.from(machineNamesSet).sort();
        this.sectoresList = Array.from(sectorsSet).sort();

        this.filterForm.get('tipoMaquina')?.updateValueAndValidity();
        this.filterForm.get('sector')?.updateValueAndValidity();
    }

    applyFilters(): void {
        const { tipoMaquina, sector, cargaColor } = this.filterForm.value;
        const tipoVal = (tipoMaquina || '').trim().toLowerCase();
        const sectorVal = (sector || '').trim().toLowerCase();
        const colorVal = (cargaColor || '').trim();

        this.filteredMaquinas = this.allMaquinas.filter(m => {
            if (tipoVal) {
                const matchesMaquina = (m.maquina && m.maquina.toLowerCase().includes(tipoVal)) ||
                    (m.tipoMaquina && m.tipoMaquina.toLowerCase().includes(tipoVal));
                if (!matchesMaquina) return false;
            }

            if (sectorVal) {
                const matchesSector = m.sector && m.sector.toLowerCase().includes(sectorVal);
                if (!matchesSector) return false;
            }

            if (colorVal) {
                const category = this.getCargaCategory(m.cantidad);
                if (category !== colorVal) return false;
            }

            return true;
        });
    }

    clearTipoMaquina(): void {
        this.filterForm.get('tipoMaquina')?.setValue('');
        this.applyFilters();
    }

    clearSector(): void {
        this.filterForm.get('sector')?.setValue('');
        this.applyFilters();
    }

    clearCargaColor(): void {
        this.filterForm.get('cargaColor')?.setValue('');
        this.applyFilters();
    }

    limpiarFiltros(): void {
        this.filterForm.patchValue({
            tipoMaquina: '',
            sector: '',
            cargaColor: ''
        });
        this.applyFilters();
    }

    getCargaCategory(cantidad: number): 'GRIS' | 'AMARILLO' | 'NARANJA' | 'ROJO' {
        if (!cantidad || cantidad === 0) {
            return 'GRIS';
        } else if (cantidad === 1 || cantidad === 2) {
            return 'AMARILLO';
        } else if (cantidad >= 3 && cantidad <= 5) {
            return 'NARANJA';
        } else {
            return 'ROJO'; // 6 o más
        }
    }

    getCardColorClasses(cantidad: number): {
        border: string;
        headerBg: string;
        dotBg: string;
        label: string;
    } {
        const category = this.getCargaCategory(cantidad);

        switch (category) {
            case 'GRIS':
                return {
                    border: 'border-gray-300 hover:border-gray-400',
                    headerBg: 'bg-gray-100/70',
                    dotBg: 'bg-gray-400',
                    label: 'Sin Carga (0 OTs)'
                };
            case 'AMARILLO':
                return {
                    border: 'border-yellow-300 hover:border-yellow-400',
                    headerBg: 'bg-yellow-50/80',
                    dotBg: 'bg-yellow-500',
                    label: 'Carga Baja (1-2 OTs)'
                };
            case 'NARANJA':
                return {
                    border: 'border-orange-300 hover:border-orange-400',
                    headerBg: 'bg-orange-50/80',
                    dotBg: 'bg-orange-500',
                    label: 'Carga Media (3-5 OTs)'
                };
            case 'ROJO':
                return {
                    border: 'border-red-300 hover:border-red-400',
                    headerBg: 'bg-red-50/80',
                    dotBg: 'bg-red-500',
                    label: 'Carga Alta (6+ OTs)'
                };
        }
    }

    openOtDetailModal(maquina: MaquinaMonitoreo): void {
        const dialogRef = this.dialog.open(DetalleOtDialogComponent, {
            data: { maquina },
            autoFocus: false,
            panelClass: 'detalle-ot-dialog-panel'
        });

        dialogRef.afterClosed().subscribe((updatedOts) => {
            if (updatedOts && Array.isArray(updatedOts)) {
                const targetIdMaquina = maquina.idMaquina ?? maquina.id;
                const found = this.allMaquinas.find(m => {
                    const mId = m.idMaquina ?? m.id;
                    return (mId !== undefined && mId === targetIdMaquina) || m.maquina === maquina.maquina;
                });
                if (found) {
                    found.cantidad = updatedOts.length;
                    this.applyFilters();
                }
            }
        });
    }
}
