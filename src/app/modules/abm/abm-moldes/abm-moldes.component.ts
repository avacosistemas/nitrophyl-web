import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MoldesService } from 'app/shared/services/moldes.service';
import { Subscription } from 'rxjs';
import { ABMMoldeService } from './abm-moldes.service';
import { filter } from 'rxjs/operators';

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
    mostrarBotonEdicion: boolean = false;
    moldeNombre: string = null;

    constructor(
        private activatedRoute: ActivatedRoute,
        private moldesService: MoldesService,
        private _abmMoldesService: ABMMoldeService,
        private router: Router,
        private cdref: ChangeDetectorRef
    ) {

        this.suscripcion = this._abmMoldesService.events.subscribe(
            (data: any) => {
                if (typeof data === 'object' && data !== null) {
                    if (data.hasOwnProperty('mostrarBotonEdicion')) {
                        this.mostrarBotonEdicion = data.mostrarBotonEdicion;
                    }
                    if (data.hasOwnProperty('nombreMolde')) {
                        this.moldeNombre = data.nombreMolde;
                    }
                } else if (typeof data === 'string') {
                    this.botonEdicion = data;
                }

            }
        );

        this.suscripcion = this._abmMoldesService.viewEvents.subscribe(
            (data: string) => {
                this.botonEdicion = data;
            }
        );

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.actualizarTitulo();
        });
    }

    ngOnInit(): void {
        this.botonEdicion = 'Guardar Molde';
        this.actualizarTitulo();
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
                this.mostrarBotonEdicion = false;
                break;
            case 'create':
                this.create();
                break;
        }
    }

    actualizarTitulo(): void {
        const url = this.router.url;

        if (url.includes('/grid')) {
            this.titulo = 'Consulta Moldes';
            this.moldeTitulo = null;
            this.moldeNombre = null;
        } else if (url.includes('/molde/ver/')) {
            this.moldeTitulo = null;
            this.titulo = 'Vista Molde';
        } else if (url.includes('/molde/editar/')) {
            this.moldeTitulo = null;
            this.titulo = 'Edición Molde';
        } else if (url.includes('/create')) {
            this.moldeTitulo = null;
            this.titulo = 'Nuevo Molde';
            this.moldeNombre = null;
        } else if (url.includes('/ingresos-egresos/')) {
            this.moldesService.getMoldeById(this.activatedRoute.snapshot.children[0].params['id']).subscribe((d) => {
                this.moldeTitulo = 'Ingresos / Egresos';
                this.titulo = d.data.nombre;
            });
        } else {
            this.titulo = 'Moldes';
            this.moldeNombre = null;
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