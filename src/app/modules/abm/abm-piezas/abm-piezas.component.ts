import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ABMPiezaService } from './abm-piezas.service';

@Component({
    selector: 'abm-piezas',
    templateUrl: './abm-piezas.component.html',
    styleUrls: ['./abm-piezas.component.scss']
})
export class ABMPiezasComponent implements OnInit, AfterContentChecked, OnDestroy {
    titulo: string = '';
    suscripcion: Subscription;
    botonEdicion: string = '';
    piezaTitulo: string = null;
    mostrarBotonEdicion: boolean = false;
    piezaNombre: string = '';

    private _piezaId: number | null = null;
    get piezaId(): number | null {
        return this._piezaId;
    }
    set piezaId(value: number | null) {
        this._piezaId = value;
    }

    constructor(
        private activatedRoute: ActivatedRoute,
        private _abmPiezasService: ABMPiezaService,
        private router: Router,
        private cdref: ChangeDetectorRef,
    ) {
        this.suscripcion = new Subscription();
    }

    ngOnInit(): void {
        this.botonEdicion = 'Guardar Pieza';
        this.detectarRutaYActualizarTitulo();

        this.suscripcion.add(
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe(() => {
                this.detectarRutaYActualizarTitulo();
            })
        );

        this.suscripcion.add(
            this._abmPiezasService.events.subscribe(event => {
                if (event) {
                    if (typeof event === 'string' && event === 'ejecutarAccion') {
                        return;
                    }

                    if (typeof event === 'object') {
                        this.mostrarBotonEdicion = event.mostrarBotonEdicion || false;
                        this.botonEdicion = event.botonEdicionTexto || 'Guardar Pieza';
                        if (event.nombrePieza) {
                            this.piezaNombre = event.nombrePieza;
                        }
                        this.cdref.markForCheck();
                    }
                }
            })
        );
    }

    ngAfterContentChecked(): void {
        // 
    }

    ngOnDestroy(): void {
        if (this.suscripcion) {
            this.suscripcion.unsubscribe();
        }
    }

    handleAction(action: string): void {
        if (action === 'close') {
            this.close();
        } else if (action === 'edit') {
            this._abmPiezasService.events.next({ type: 'ejecutarAccion' });
        } else if (action === 'create') {
            this.router.navigate(['/procesos-piezas/create']);
        } else if (action === 'Añadir Esquema') {
            this._abmPiezasService.events.next({ type: 'ejecutarAccion' });
        }
    }

    detectarRutaYActualizarTitulo(): void {
        const url = this.router.url;

        const match = url.match(/\/procesos-piezas\/(\d+)\/(edit|view)/);
        if (match) {
            this.piezaId = +match[1];
        } else {
            this.piezaId = null;
        }

        if (url.includes('/procesos-piezas/grid')) {
            this.establecerTituloConsulta();
        } else if (url.match(/\/procesos-piezas\/\d+\/view/)) {
            this.establecerTituloVista();
        } else if (url.match(/\/procesos-piezas\/\d+\/edit/)) {
            this.establecerTituloEdicion();
        } else if (url.includes('/procesos-piezas/create')) {
            this.establecerTituloCreacion();
        } else {
            this.establecerTituloGenerico();
        }
    }

    private establecerTituloConsulta(): void {
        this.titulo = 'Consulta Piezas';
        this.piezaTitulo = null;
        this.piezaNombre = '';
        this.mostrarBotonEdicion = false;
        this._abmPiezasService.events.next(null);
    }

    private establecerTituloVista(): void {
        this.titulo = 'Vista Pieza';
        this.piezaTitulo = null;
        this.mostrarBotonEdicion = false;
        this.cargarDatosPieza();
    }

    private establecerTituloEdicion(): void {
        this.titulo = 'Edición Pieza';
        this.piezaTitulo = null;
        this.mostrarBotonEdicion = true;
        this.cargarDatosPieza();
    }

    private establecerTituloCreacion(): void {
        this.titulo = 'Nueva Pieza';
        this.piezaTitulo = null;
        this.piezaNombre = '';
        this.mostrarBotonEdicion = true;
    }

    private establecerTituloGenerico(): void {
        this.titulo = 'Piezas';
        this.piezaNombre = '';
        this.mostrarBotonEdicion = false;
    }

    private cargarDatosPieza(): void {
        if (this.piezaId !== null) {
            this._abmPiezasService.getPieza(this.piezaId).subscribe(pieza => {
                if (pieza) {
                    this.piezaNombre = pieza.denominacion;
                    this.cdref.markForCheck();
                }
            });
        }
    }

    close(): void {
        this.router.navigate(['/procesos-piezas/grid']);
    }
}