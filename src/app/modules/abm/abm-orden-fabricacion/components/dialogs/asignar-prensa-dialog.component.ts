import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, Observable, of, merge } from 'rxjs';
import { takeUntil, startWith, map, switchMap, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { AbmSectorFabricaService } from 'app/modules/abm/abm-sector-fabrica/abm-sector-fabrica.service';
import { AbmMaquinaFabricaService } from 'app/modules/abm/abm-maquina-fabrica/abm-maquina-fabrica.service';
import { UserService } from 'app/shared/services/user.service';

@Component({
    selector: 'app-asignar-prensa-dialog',
    templateUrl: './asignar-prensa-dialog.component.html',
})
export class AsignarPrensaDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    filteredSectores$: Observable<any[]>;
    filteredMaquinas$: Observable<any[]>;
    filteredOperarios$: Observable<any[]>;
    operarios: any[] = [];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AsignarPrensaDialogComponent>,
        private _sectorService: AbmSectorFabricaService,
        private _maquinaService: AbmMaquinaFabricaService,
        private _userService: UserService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.form = this.fb.group({
            sector: [null, Validators.required],
            maquina: [{ value: null, disabled: true }],
            operario: [null]
        });
    }

    ngOnInit(): void {
        this.filteredSectores$ = this.form.get('sector').valueChanges.pipe(
            startWith(''),
            debounceTime(150),
            distinctUntilChanged(),
            switchMap(value => {
                const nombre = typeof value === 'string' ? value : '';
                return this._sectorService.getSectoresCombo(nombre).pipe(
                    map(res => res.data || []),
                    catchError(() => of([]))
                );
            })
        );

        this.filteredMaquinas$ = merge(
            this.form.get('maquina').valueChanges.pipe(
                map(value => typeof value === 'string' ? value : '')
            ),
            this.form.get('sector').valueChanges.pipe(
                map(() => '')
            )
        ).pipe(
            startWith(''),
            debounceTime(150),
            switchMap(nombre => {
                const sector = this.form.get('sector').value;
                const idSector = sector && sector.id ? sector.id : null;
                if (!idSector) {
                    return of([]);
                }
                return this._maquinaService.getMaquinasCombo(idSector, nombre).pipe(
                    map(res => res.data || []),
                    catchError(() => of([]))
                );
            })
        );

        this.form.get('sector').valueChanges.pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe(sector => {
            const maquinaControl = this.form.get('maquina');
            if (sector && sector.id) {
                maquinaControl.enable({ emitEvent: false });
            } else {
                maquinaControl.disable({ emitEvent: false });
                maquinaControl.setValue(null, { emitEvent: false });
            }
        });

        this._userService.getUsersCombo().pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (res) => {
                this.operarios = res.data || [];
                this.form.get('operario').updateValueAndValidity();
            },
            error: (err) => {
                console.error('Error loading operarios combo:', err);
            }
        });

        this.filteredOperarios$ = this.form.get('operario').valueChanges.pipe(
            startWith(''),
            map(value => this._filterOperarios(value))
        );
    }

    private _filterOperarios(value: any): any[] {
        const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
        return this.operarios.filter(o => o.nombre?.toLowerCase().includes(filterValue));
    }

    displayFnSector(sector: any): string {
        return sector?.nombre || '';
    }

    displayFnMaquina(maquina: any): string {
        return maquina?.nombre || '';
    }

    displayFnOperario(operario: any): string {
        return operario?.nombre || '';
    }

    clearControl(controlName: string): void {
        this.form.get(controlName).setValue(null);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    save() {
        if (this.form.valid) {
            const sector = this.form.get('sector').value;
            const maquina = this.form.get('maquina').value;
            const operario = this.form.get('operario').value;

            if (!sector || !sector.id) {
                this.form.get('sector').setErrors({ mustSelectOption: true });
                return;
            }

            const result = {
                idSector: sector.id,
                idMaquina: (maquina && maquina.id) ? maquina.id : 0,
                idUsuario: (operario && operario.id) ? operario.id : 0
            };
            this.dialogRef.close(result);
        }
    }
}