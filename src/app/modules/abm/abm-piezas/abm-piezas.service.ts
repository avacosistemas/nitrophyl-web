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
    PiezaNombreResponse,
    PiezaDimension
} from './models/pieza.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { base64Content, base64Imagen } from './base64-data';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ABMPiezaService {
    viewEvents = new EventEmitter<any>();
    public events = new BehaviorSubject<any>(null);

    private readonly API_BASE_URL = environment.server;
    private readonly API_PIEZA_URL = `${this.API_BASE_URL}pieza`;
    private readonly API_PIEZA_PLANO_URL = `${this.API_BASE_URL}piezaPlano`;
    private readonly API_PIEZA_CLIENTE_URL = `${this.API_BASE_URL}piezaCliente`;
    private readonly API_PIEZA_DIMENSION_URL = `${this.API_BASE_URL}piezaDimension`;
    private readonly API_PIEZA_TIPO_URL = `${this.API_BASE_URL}piezaTipo`;
    private readonly API_MOLDE_URL = `${this.API_BASE_URL}molde`;

    constructor(private http: HttpClient) { }

    getDimensionesPorPieza(idPieza: number): Observable<any> {
        const params = new HttpParams().set('idPieza', idPieza.toString());
        return this.http.get<any>(this.API_PIEZA_DIMENSION_URL, { params });
    }

    agregarDimensionAPieza(dto: any): Observable<PiezaDimension> {
        return this.http.post<PiezaDimension>(this.API_PIEZA_DIMENSION_URL, dto);
    }

    actualizarDimensionDePieza(id: number, dto: any): Observable<PiezaDimension> {
        return this.http.put<PiezaDimension>(`${this.API_PIEZA_DIMENSION_URL}/${id}`, dto);
    }

    eliminarDimensionDePieza(id: number): Observable<any> {
        return this.http.delete<any>(`${this.API_PIEZA_DIMENSION_URL}/${id}`);
    }

    getClientesPorPieza(idPieza: number): Observable<any> {
        const params = new HttpParams().set('idPieza', idPieza.toString());
        return this.http.get<any>(this.API_PIEZA_CLIENTE_URL, { params });
    }

    agregarClienteAPieza(dto: any): Observable<any> {
        return this.http.post<any>(this.API_PIEZA_CLIENTE_URL, dto);
    }

    eliminarClienteDePieza(idAsociacion: number): Observable<any> {
        return this.http.delete<any>(`${this.API_PIEZA_CLIENTE_URL}/${idAsociacion}`);
    }

    private moldesAsociadosMock: Molde[] = [];

    getPiezas(params: any): Observable<any> {
        return this.http.get<any>(this.API_PIEZA_URL, { params });
    }

    getPieza(id: number): Observable<Pieza | undefined> {
        return this.http.get<Pieza>(`${this.API_PIEZA_URL}/${id}`);
    }

    agregarPieza(dto: any): Observable<any> {
        return this.http.post<any>(this.API_PIEZA_URL, dto);
    }

    clonarPieza(idPieza: number): Observable<any> {
        return this.http.put(`${this.API_PIEZA_URL}/clonar/${idPieza}`, {});
    }

    marcarVigente(idPieza: number): Observable<any> {
        return this.http.put(`${this.API_PIEZA_URL}/marcarvigente/${idPieza}`, {});
    }

    getPlanos(idPieza: number): Observable<Plano[]> {
        const params = new HttpParams().set('idPieza', idPieza.toString());
        return this.http.get<Plano[]>(this.API_PIEZA_PLANO_URL, { params });
    }

    uploadPlano(dto: any): Observable<any> {
        return this.http.post(this.API_PIEZA_PLANO_URL, dto);
    }

    downloadPlano(idPlano: number): Observable<Blob> {
        return this.http.get(`${this.API_PIEZA_PLANO_URL}/${idPlano}/download`, { responseType: 'blob' });
    }

    deletePlano(idPlano: number): Observable<any> {
        return this.http.delete(`${this.API_PIEZA_PLANO_URL}/${idPlano}`);
    }

    private simulateApiCall<T>(data: T, delayTime: number = 500): Observable<T> {
        return of(data).pipe(delay(delayTime));
    }

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

    editarPieza(pieza: Pieza): Observable<Pieza> {
        return this.simulateApiCall(pieza);
    }

    editarPiezaEnBackend(pieza: Pieza): Observable<Pieza> {
        return this.simulateApiCall(pieza);
    }

    getFormulas(): Observable<{ id: number; nombre: string }[]> {
        return this.simulateApiCall([
            { id: 1, nombre: 'Formula 1' },
            { id: 2, nombre: 'Formula 2' },
            { id: 3, nombre: 'Formula 3' },
        ]);
    }

    getMoldes(): Observable<{ id: number; nombre: string }[]> {
        const params = new HttpParams()
            .set('asc', 'true')
            .set('first', '1')
            .set('rows', '99');

        return this.http.get<any>(this.API_MOLDE_URL, { params }).pipe(
            map(response => response.data.page || [])
        );
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

    getPiezaTipo(): Observable<{ id: number; nombre: string }[]> {
        return this.http.get<any>(this.API_PIEZA_TIPO_URL).pipe(
            map(response => response.data || [])
        );
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

    getPiezaNombre(): Observable<string[]> {
        const params = new HttpParams()
            .set('asc', 'true')
            .set('first', '1')
            .set('rows', '999')
            .set('soloVigentes', 'true');

        return this.http.get<PiezaNombreResponse>(this.API_PIEZA_URL, { params }).pipe(
            map(response => {
                if (!response || !response.data || !Array.isArray(response.data.page)) {
                    return [];
                }
                const todasLasDenominaciones = response.data.page.map(pieza => pieza.denominacion);
                return [...new Set(todasLasDenominaciones)];
            }),
            catchError(error => {
                console.error('Error al obtener los nombres de las piezas:', error);
                return of([]);
            })
        );
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
}
