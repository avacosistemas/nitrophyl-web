import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MoldesService } from 'app/shared/services/moldes.service';
import { Subscription } from 'rxjs';
import { ABMMoldeService } from './abm-moldes-service';

@Component({
    selector: 'abm-moldes',
    templateUrl: './abm-moldes.component.html',
    styleUrls: ['./abm-moldes.component.scss']
})

export class ABMMoldesComponent implements OnInit, AfterContentChecked, OnDestroy {
    titulo: string = '';
    suscripcion: Subscription;
    botonEdicion: string = '';
    moldeTitulo: string = null;

    constructor(
        private activatedRoute: ActivatedRoute,
        private moldesService: MoldesService,
        private _abmMoldesService: ABMMoldeService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) {
        this.suscripcion = this._abmMoldesService.viewEvents.subscribe(
            (data: string) => {
                this.botonEdicion = data;
            }
        );
    }

    ngOnInit(): void {
        this.botonEdicion = 'Guardar Molde';
    }

    ngAfterContentChecked(): void {
        this.cdref.detectChanges();
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    handleAction(action: string): void {
        switch (action) {
            case 'edit':
                this.edit();
                break;
            case 'save':
                this.save();
                break;
            case 'ingresoEgreso':
                this.ingresoEgreso();
                break;
            case 'close':
                this.close();
                break;
            case 'create':
                this.create();
                break;
        }
    }

    componentAdded(event): void {
        if (event.component === 'Grilla') {
            this.titulo = 'Consulta Moldes';
            this.moldeTitulo = null;
        }
        if (event.component === 'Molde') {
            this.moldeTitulo = null;
            if (this.moldesService.getMode() === 'Edit') {
                this.titulo = 'Edición Molde';
            }
            if (this.moldesService.getMode() === 'View' || this.moldesService.getMode() === undefined) {
                this.titulo = 'Vista Molde';
            }
        }
        if (event.component === 'Create') {
            this.moldeTitulo = null;
            this.titulo = 'Nuevo Molde';
        }
        if (event.component === 'Ingresos / Egresos') {
            this.titulo = '...';
            this.moldesService.getMoldeById(this.activatedRoute.snapshot.children[0].params['id']).subscribe((d) => {
                this.moldeTitulo = 'Ingresos / Egresos';
                this.titulo = d.data.nombre;
            });
        }
    }

    edit(): void {
        this._abmMoldesService.events.next(2);
    }

    close(): void {
        this._abmMoldesService.events.next(1);
    }

    create(): void {
        this.moldesService.setMode('Create');
        this.router.navigate(['../moldes/create']);
    }

    save(): void {
        this._abmMoldesService.events.next(4);
    }

    ingresoEgreso(): void {
        this._abmMoldesService.events.next(5);
    }
}
