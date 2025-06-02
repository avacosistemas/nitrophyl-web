import { EventEmitter, Injectable } from '@angular/core';
import {
    Pieza,
    TipoInsumo,
    Insumo,
    InsumoPieza,
    Dimension,
    Moldeo,
    DesmoldantePostCura,
    Esquema,
    Finalizacion,
    Prensa,
    Bombeo,
    Plano,
    Molde,
} from './models/pieza.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { base64Content, base64Imagen } from './base64-data';

@Injectable({
    providedIn: 'root',
})
export class ABMPiezaService {
    viewEvents = new EventEmitter<any>();
    public events = new BehaviorSubject<any>(null);

    private piezasMock: Pieza[] = [
        {
            id: 1,
            nombre: 'Pieza A',
            formula: 'A001',
            material: 'Material X',
            revision: '1',
            fechaRevision: new Date(),
            moldeId: 1,
            espesorPlanchaMin: 2,
            espesorPlanchaMax: 3,
            pesoCrudo: 150,
            observacionesPesoCrudo: 'Peso aproximado',
            tipo: 'Tipo 1',
            vigente: true,
            permiteEditar: true,
            permiteGenerarRevision: true,
            permiteMarcarRevision: true,
            dureza: 90,
            clienteId: 1,
            nombrePiezaPersonalizado: 'Personalizado A'
        },
        {
            id: 2,
            nombre: 'Pieza B',
            formula: 'A002',
            material: 'Material Y',
            revision: '2',
            fechaRevision: new Date(),
            moldeId: 2,
            espesorPlanchaMin: 1,
            espesorPlanchaMax: 2,
            pesoCrudo: 80,
            observacionesPesoCrudo: 'Sin rebabas',
            tipo: 'Tipo 2',
            vigente: false,
            permiteEditar: false,
            permiteGenerarRevision: true,
            permiteMarcarRevision: false,
            dureza: 80,
            clienteId: 2,
            nombrePiezaPersonalizado: 'Personalizado B'
        },
        {
            id: 3,
            nombre: 'Pieza C',
            formula: 'A003',
            material: 'Material Z',
            revision: '3',
            fechaRevision: new Date(),
            moldeId: 3,
            espesorPlanchaMin: 3,
            espesorPlanchaMax: 3,
            pesoCrudo: 220,
            observacionesPesoCrudo: 'Requiere pulido',
            tipo: 'Tipo 1',
            vigente: true,
            permiteEditar: true,
            permiteGenerarRevision: false,
            permiteMarcarRevision: true,
            dureza: 100,
            clienteId: 3,
            nombrePiezaPersonalizado: 'Personalizado C'
        },
    ];

    private moldesAsociadosMock: Molde[] = [];

    agregarMolde(piezaId: number, molde: Molde): Observable<any> {
        this.moldesAsociadosMock.push(molde);
        return this.simulateApiCall({ status: 'OK' });
    }

    eliminarMolde(piezaId: number, molde: Molde): Observable<any> {
        this.moldesAsociadosMock = this.moldesAsociadosMock.filter(m => m.id !== molde.id);
        return this.simulateApiCall({ status: 'OK' });
    }

    private insumosPiezaMock: InsumoPieza[] = [
        {
            id: 1,
            tipo: [
                {
                    id: 1,
                    nombre: 'caño',
                    subniveles: [{ id: 2, nombre: 'rojo', padre: { id: 1, nombre: 'caño' } }],
                },
                { id: 2, nombre: 'rojo', padre: { id: 1, nombre: 'caño' } },
            ],
            nombreInsumo: { id: 1, nombre: 'caño rojo', tipoId: 2 },
            medidaValor: 285,
            medidaObservaciones: 'con gancho',
            tratamiento: 'pintado',
            adhesivos: ['Adhesivo A'],
            observaciones: 'ninguna',
        },
        {
            id: 2,
            tipo: [{ id: 4, nombre: 'teflon' }],
            nombreInsumo: { id: 3, nombre: 'teflon', tipoId: 4 },
            medidaValor: 100,
            medidaObservaciones: '',
            tratamiento: 'none',
            adhesivos: [],
            observaciones: 'importante',
        },
    ];

    private tiposInsumoMock: TipoInsumo[] = [
        {
            id: 1,
            nombre: 'caño',
            subniveles: [
                { id: 2, nombre: 'rojo', padre: { id: 1, nombre: 'caño' } }],
        },
        { id: 4, nombre: 'teflon' },
        { id: 5, nombre: 'tela' },
        {
            id: 6,
            nombre: 'inserto',
            subniveles: [
                { id: 7, nombre: 'tornillo', padre: { id: 6, nombre: 'inserto' } },
                {
                    id: 8,
                    nombre: 'arandela',
                    padre: { id: 6, nombre: 'inserto' },
                    subniveles: [
                        { id: 9, nombre: 'grandes', padre: { id: 8, nombre: 'arandela' } },
                        { id: 10, nombre: 'chicas', padre: { id: 8, nombre: 'arandela' } },
                    ],
                },
            ],
        },
    ];

    private adhesivosMock: string[] = ['Adhesivo A', 'Adhesivo B', 'Adhesivo C'];

    private insumosMock: Insumo[] = [
        { id: 1, nombre: 'caño rojo', tipoId: 2 },
        { id: 2, nombre: 'caño verde', tipoId: 3 },
        { id: 3, nombre: 'teflon', tipoId: 4 },
        { id: 4, nombre: 'tornillo', tipoId: 7 },
        { id: 5, nombre: 'arandela grande', tipoId: 9 },
        { id: 6, nombre: 'arandela chica', tipoId: 10 },
    ];

    private dimensionesMock: Dimension[] = [
        { tipoDimension: 'ALTO', valor: 100, observaciones: 'Total' },
        { tipoDimension: 'ANCHO', valor: 50, observaciones: 'Base' },
        { tipoDimension: 'PROFUNDIDAD', valor: 25, observaciones: 'Máxima' },
    ];

    private prensasMock: Prensa[] = [
        { id: 1, nombre: 'Prensa A' },
        { id: 2, nombre: 'Prensa B' },
        { id: 3, nombre: 'Prensa C' },
    ];

    private tiposBombeoMock: string[] = ['Escalonados', 'A fondo', 'Suave'];

    private moldeoMock: Moldeo = {
        prensaSeleccionada: [{ id: 1, nombre: 'Prensa A' }],
        precalentamientoHabilitado: false,
        precalentamientoTiempo: 10,
        precalentamientoUnidad: 'minutos',
        vulcanizacionTiempo: 60,
        vulcanizacionTemperaturaMinima: 150,
        vulcanizacionTemperaturaMaxima: 180,
        bombas: [{ cantidad: 5, tipo: 'Escalonado', presion: 20 }],
    };

    private desmoldantePostCuraMock: DesmoldantePostCura = {
        desmoldante: 'Desmoldante A',
        observacionesDesmoldante: 'Aplicar con cuidado',
        postcura: '2 horas a 80 grados',
    };

    private esquemasMock: Esquema[] = [
        { id: 1, titulo: 'Esquema 1', pasos: ['Paso 1', 'Paso 2'], imagenBase64: base64Imagen },
        { id: 2, titulo: 'Esquema 2', pasos: ['Paso A', 'Paso B', 'Paso C'] },
    ];

    private finalizacionMock: Finalizacion = {
        refilado: 'Refilado manual',
        identificacion: 'Sarasa',
        embalaje: 'Caja de cartón',
        imagenEmbalaje: base64Imagen,
    };

    private planosMock: Plano[] = [
        { id: 1, nombreArchivo: 'plano1.pdf', clasificacion: 'NITROPHYL', descripcion: 'Plano general', version: '1', fecha: '2024-01-01', codigo: 'PG001', revision: 1 },
        { id: 2, nombreArchivo: 'plano2.pdf', clasificacion: 'CLIENTE', descripcion: 'Plano detalle', version: '2', fecha: '2024-02-15', codigo: 'PD002', revision: 2 },
    ];

    private piezasSubject = new BehaviorSubject<Pieza[]>(this.piezasMock);
    piezas$ = this.piezasSubject.asObservable();

    private simulateApiCall<T>(data: T, delayTime: number = 500): Observable<T> {
        return of(data).pipe(delay(delayTime));
    }

    getJerarquiaTipos(tipo: TipoInsumo): Observable<TipoInsumo[]> {
        return of(this.getJerarquiaTiposSincrono(tipo));
    }

    getJerarquiaTiposSincrono(tipo: TipoInsumo): TipoInsumo[] {
        const jerarquia: TipoInsumo[] = [];
        let current: TipoInsumo | undefined = tipo;

        while (current) {
            jerarquia.unshift(current);
            current =
                current.padre && typeof current.padre === 'object'
                    ? this.tiposInsumoMock.find((t) => t.id === current.padre.id)
                    : undefined;
        }

        return jerarquia;
    }

    getPiezas(): Observable<Pieza[]> {
        return this.simulateApiCall(this.piezasMock);
    }

    getPieza(id: number): Observable<Pieza | undefined> {
        return this.simulateApiCall(this.piezasMock.find((pieza) => pieza.id === id));
    }

    agregarPieza(pieza: Pieza): Observable<Pieza> {
        pieza.id = this.piezasMock.length + 1;
        this.piezasMock.push(pieza);
        this.piezasSubject.next([...this.piezasMock]);
        return this.simulateApiCall(pieza);
    }

    editarPieza(pieza: Pieza): Observable<Pieza> {
        const index = this.piezasMock.findIndex((p) => p.id === pieza.id);
        if (index !== -1) {
            this.piezasMock[index] = pieza;
            this.piezasSubject.next([...this.piezasMock]);
        }
        return this.simulateApiCall(pieza);
    }

    editarPiezaEnBackend(pieza: Pieza): Observable<Pieza> {
        return this.simulateApiCall(pieza);
    }

    generarNuevaRevision(piezaId: number): Observable<Pieza> {
        const pieza = this.piezasMock.find((p) => p.id === piezaId);
        if (pieza) {
            const nuevaRevision = { ...pieza, revision: (parseInt(pieza.revision) + 1).toString(), vigente: false };
            this.piezasMock.push(nuevaRevision);
            this.piezasSubject.next([...this.piezasMock]);
            return this.simulateApiCall(nuevaRevision);
        } else {
            return of(undefined);
        }
    }

    marcarVigente(piezaId: number): Observable<Pieza> {
        const pieza = this.piezasMock.find((p) => p.id === piezaId);
        if (pieza) {
            pieza.vigente = true;
            this.piezasSubject.next([...this.piezasMock]);
            return this.simulateApiCall(pieza);
        } else {
            return of(undefined);
        }
    }

    getFormulas(): Observable<{ id: number; nombre: string }[]> {
        return this.simulateApiCall([
            { id: 1, nombre: 'Formula 1' },
            { id: 2, nombre: 'Formula 2' },
            { id: 3, nombre: 'Formula 3' },
        ]);
    }

    getMoldes(): Observable<{ id: number; nombre: string }[]> {
        return this.simulateApiCall([
            { id: 1, nombre: 'Molde A' },
            { id: 2, nombre: 'Molde B' },
            { id: 3, nombre: 'Molde C' },
        ]);
    }

    getClientes(): Observable<{ id: number; nombre: string }[]> {
        return this.simulateApiCall([
            { id: 1, nombre: 'Cliente X' },
            { id: 2, nombre: 'Cliente Y' },
            { id: 3, nombre: 'Cliente Z' },
        ]);
    }

    getTiposInsumo(): Observable<TipoInsumo[]> {
        return this.simulateApiCall(this.tiposInsumoMock);
    }

    getInsumos(tipoId: number): Observable<Insumo[]> {
        return this.simulateApiCall(this.insumosMock.filter((insumo) => insumo.tipoId === tipoId));
    }

    getAdhesivos(): Observable<string[]> {
        return this.simulateApiCall(this.adhesivosMock);
    }

    getInsumosPieza(piezaId: number): Observable<InsumoPieza[]> {
        return this.simulateApiCall(this.insumosPiezaMock);
    }

    getDimensiones(piezaId: number): Observable<Dimension[]> {
        return this.simulateApiCall(this.dimensionesMock);
    }

    updatePiezaDimensiones(piezaId: number, dimensiones: Dimension[]): Observable<any> {
        dimensiones.forEach(dm => {
            const index = this.dimensionesMock.findIndex(d => d.tipoDimension === dm.tipoDimension && d.observaciones === dm.observaciones);
            if (index !== -1) {
                this.dimensionesMock[index] = dm;
            }
        });
        return this.simulateApiCall({ status: 'OK' });
    }

    getTipoPieza(): Observable<string[]> {
        return this.simulateApiCall(['Diafragma', 'Otro Tipo', 'Baldoza' ]);
    }

    getTiposDimension(): Observable<string[]> {
        return this.simulateApiCall(['ALTO', 'ANCHO', 'PROFUNDIDAD', 'DIAMETRO']);
    }

    getMoldeo(piezaId: number): Observable<Moldeo> {
        return this.simulateApiCall(this.moldeoMock);
    }

    getPrensas(): Observable<Prensa[]> {
        return this.simulateApiCall(this.prensasMock);
    }

    getTiposBombeo(): Observable<string[]> {
        return this.simulateApiCall(this.tiposBombeoMock);
    }

    updateMoldeo(piezaId: number, moldeo: Moldeo): Observable<any> {
        this.moldeoMock = moldeo;
        return this.simulateApiCall({ status: 'OK' });
    }

    getDesmoldantePostCura(piezaId: number): Observable<DesmoldantePostCura> {
        return this.simulateApiCall(this.desmoldantePostCuraMock);
    }

    getDesmoldantes(): Observable<string[]> {
        return this.simulateApiCall(['No', 'Desmoldante A', 'Desmoldante B']);
    }

    updateDesmoldantePostCura(piezaId: number, data: DesmoldantePostCura): Observable<any> {
        this.desmoldantePostCuraMock = data;
        return this.simulateApiCall({ status: 'OK' });
    }

    getEsquemas(piezaId: number): Observable<Esquema[]> {
        return this.simulateApiCall(this.esquemasMock);
    }

    updateEsquema(piezaId: number, esquema: Esquema): Observable<any> {
        const index = this.esquemasMock.findIndex((e) => e.id === esquema.id);
        if (index !== -1) {
            this.esquemasMock[index] = esquema;
        } else {
            esquema.id = this.esquemasMock.length + 1;
            this.esquemasMock.push(esquema);
        }
        return this.simulateApiCall({ status: 'OK' });
    }

    deleteEsquema(piezaId: number, esquemaId: number): Observable<any> {
        this.esquemasMock = this.esquemasMock.filter((e) => e.id !== esquemaId);
        return this.simulateApiCall({ status: 'ok' });
    }

    getFinalizacion(piezaId: number): Observable<Finalizacion> {
        return this.simulateApiCall(this.finalizacionMock);
    }

    updateFinalizacion(piezaId: number, finalizacion: Finalizacion): Observable<any> {
        this.finalizacionMock = finalizacion;
        return this.simulateApiCall({ status: 'OK' });
    }

    getPlanos(piezaId: number): Observable<Plano[]> {
        return this.simulateApiCall(this.planosMock);
    }

    uploadPlano(
        piezaId: number,
        archivo: string,
        nombreArchivo: string,
        descripcion: string,
        clasificacion: string,
        codigo: string,
        revision: number
    ): Observable<any> {
        console.log("Simulando la carga del plano con los datos:", {
            piezaId, archivo, nombreArchivo, descripcion, clasificacion, codigo, revision
        });
        const newPlano: Plano = {
            nombreArchivo: nombreArchivo,
            clasificacion: clasificacion,
            descripcion: descripcion,
            version: revision.toString(),
            fecha: new Date().toISOString().slice(0, 10),
            codigo: codigo,
            revision: revision,
        };

        return this.simulateApiCall({ status: 'ok', plano: newPlano });
    }

    getPiezaNombre(): Observable<{ id: number; nombre: string }[]> {
        return this.simulateApiCall([
            { id: 1, nombre: 'Pieza D' },
            { id: 2, nombre: 'Pieza E' },
            { id: 3, nombre: 'Pieza F' },
        ]);
    }

    updateButtonState(state: any) {
        const currentState = this.events.getValue();
        if (typeof currentState === 'object' && currentState !== null) {
            this.events.next({
                ...currentState,
                ...state,
            });
        } else {
            this.events.next(state);
        }
    }

    downloadPlano(planoId: number): Observable<any> {
        const plano = this.planosMock.find((p) => p.id === planoId);
        if (plano) {
            return this.simulateApiCall({
                status: 'OK',
                data: { archivo: base64Content, nombreArchivo: plano.nombreArchivo },
            });
        } else {
            return this.simulateApiCall(undefined);
        }
    }
}