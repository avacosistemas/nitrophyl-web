import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ABMPiezaService } from '../abm-piezas.service';
import { Subscription, take } from 'rxjs';

@Component({
    selector: 'app-abm-pieza-base',
    template: ''
})
export class ABMPiezaBaseComponent implements OnDestroy {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    piezaId: number | null = null;
    form: FormGroup;
    subscriptions: Subscription[] = [];
    currentTab: number = 0;
    isNew: boolean;
    piezaForm: FormGroup;
    mode: 'create' | 'view' | 'edit' = 'create';

    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected abmPiezaService: ABMPiezaService,
        public dialog: MatDialog,
    ) {
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    tabChange(event: MatTabChangeEvent): void {
        if (this.isFormDirty() && this.isNew) {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '450px',
                data: {
                    seccion: 'Datos de la Pieza',
                    message: '¿Está seguro que desea continuar sin guardar los cambios realizados?',
                    confirmButtonText: 'Continuar',
                    cancelButtonText: 'Volver',
                },
            });

            dialogRef.afterClosed().pipe(take(1)).subscribe(res => {
                if (res === 'confirm') {
                    this.form.markAsPristine();
                    this.currentTab = event.index;
                    this.tabGroup.selectedIndex = event.index;
                    this.updateViewEvents();
                } else {
                    this.form.markAsPristine();
                    this.tabGroup.selectedIndex = this.currentTab;
                }
            });
        } else {
            this.currentTab = event.index;
            this.updateViewEvents();
        }
    }

    isFormDirty(): boolean {
        if (!this.piezaForm) {
            return false;
        }
        return this.piezaForm.dirty;
    }


    updateViewEvents(): void {
        if (!this.piezaForm) { return; }

        if (this.mode === 'view') {
            this.abmPiezaService.events.next({
                mostrarBotonEdicion: false,
                nombrePieza: this.piezaForm.get('nombre').value,
                botonEdicionTexto: ''
            });
            return;
        }

        let mostrarBoton = false;
        let botonTexto = this.mode === 'create' ? 'Crear Pieza' : 'Guardar Pieza';

        if (this.currentTab === 0) {
            mostrarBoton = true;
        } else {
            mostrarBoton = false;
        }

        if (this.mode === 'create') {
            mostrarBoton = this.currentTab === 0;
        }

        this.abmPiezaService.events.next({
            mostrarBotonEdicion: mostrarBoton,
            nombrePieza: this.piezaForm.get('nombre').value,
            botonEdicionTexto: botonTexto
        });
    }

    public resetBaseFormState(): void {
        if (this.piezaForm) {
            this.piezaForm.reset();
            this.piezaForm.markAsPristine();
            this.piezaForm.markAsUntouched();
        }
        if (this.form) {
            this.form.reset();
            this.form.markAsPristine();
            this.form.markAsUntouched();
        }
    }
}