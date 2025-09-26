import { Injectable } from '@angular/core';
import {
    Insumo, Esquema, Finalizacion,
    Prensa, Plano, Molde, PiezaDimension, PiezaProceso,
    ApiResponse, PiezaCreateDTO, PiezaUpdateDTO, IPiezaMolde, PiezaCliente,
    IInsumoTratado, IAdhesivo, ITipoInsumoJerarquico, ITratamiento, IPaginatedResponse
} from './models/pieza.model';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ABMPiezaService {
    public events = new BehaviorSubject<any>(null);

    private buttonStateSubject = new BehaviorSubject<any>(null);
    public buttonState$ = this.buttonStateSubject.asObservable();

    private actionSubject = new Subject<void>();
    public actionEvents$ = this.actionSubject.asObservable();

    private readonly API_BASE_URL = environment.server;
    private readonly API_PIEZA_URL = `${this.API_BASE_URL}pieza`;
    private readonly API_PIEZA_PLANO_URL = `${this.API_BASE_URL}piezaPlano`;
    private readonly API_PIEZA_CLIENTE_URL = `${this.API_BASE_URL}piezaCliente`;
    private readonly API_PIEZA_DIMENSION_URL = `${this.API_BASE_URL}piezaDimension`;
    private readonly API_PIEZA_TIPO_URL = `${this.API_BASE_URL}piezaTipo`;
    private readonly API_MOLDE_URL = `${this.API_BASE_URL}molde`;
    private readonly API_PIEZA_MOLDE_URL = `${this.API_BASE_URL}piezaMolde`;
    private readonly API_ESQUEMA_URL = `${this.API_BASE_URL}esquema`;
    private readonly API_TERMINACION_URL = `${this.API_BASE_URL}terminacion`;
    private readonly API_INSUMO_TRATADO_URL = `${this.API_BASE_URL}insumoTratado`;
    private readonly API_PRENSA_URL = `${this.API_BASE_URL}prensa`;
    private readonly API_TIPO_INSUMO_URL = `${this.API_BASE_URL}tipoInsumo`;
    private readonly API_INSUMO_URL = `${this.API_BASE_URL}insumo`;
    private readonly API_TRATAMIENTO_URL = `${this.API_BASE_URL}tratamiento`;
    private readonly API_ADHESIVO_URL = `${this.API_BASE_URL}adhesivo`;

    constructor(private http: HttpClient) { }

    getPiezas(params: any): Observable<any> {
        return this.http.get<any>(this.API_PIEZA_URL, { params });
    }

    getByIdEdicion(id: number): Observable<PiezaProceso> {
        return this.http.get<ApiResponse<PiezaProceso>>(`${this.API_PIEZA_URL}/${id}`).pipe(
            map(response => response.data)
        );
    }

    getPieza(id: number): Observable<any> {
        return this.http.get<any>(`${this.API_PIEZA_URL}/${id}`).pipe(
            map(response => response.data)
        );
    }

    agregarPieza(dto: PiezaCreateDTO): Observable<any> {
        return this.http.post<any>(this.API_PIEZA_URL, dto);
    }

    updatePieza(id: number, dto: PiezaUpdateDTO): Observable<any> {
        return this.http.put<any>(`${this.API_PIEZA_URL}/${id}`, dto);
    }

    clonarPieza(idPieza: number): Observable<any> {
        return this.http.put(`${this.API_PIEZA_URL}/clonar/${idPieza}`, {});
    }

    marcarVigente(idPieza: number): Observable<any> {
        return this.http.put(`${this.API_PIEZA_URL}/marcarvigente/${idPieza}`, {});
    }

    getMoldes(): Observable<{ id: number; nombre: string }[]> {
        const params = new HttpParams().set('asc', 'true').set('first', '1').set('rows', '99');
        return this.http.get<any>(this.API_MOLDE_URL, { params }).pipe(
            map(response => response?.data?.page || []),
            catchError(() => of([]))
        );
    }

    getMoldesCombo(nombreMolde: string, idTipoPieza?: number): Observable<ApiResponse<Molde[]>> {
        let params = new HttpParams().set('nombre', nombreMolde);
        if (idTipoPieza) {
            params = params.set('idTipoPieza', idTipoPieza.toString());
        }
        return this.http.get<ApiResponse<{ nombre: string, codigo: string }[]>>(`${this.API_MOLDE_URL}/combo`, { params }).pipe(
            map(response => ({
                ...response,
                data: response.data.map(item => ({ id: Number(item.codigo), nombre: item.nombre }))
            }))
        );
    }

    getPiezaMoldes(idPieza: number): Observable<ApiResponse<IPiezaMolde[]>> {
        return this.http.get<ApiResponse<IPiezaMolde[]>>(`${this.API_PIEZA_MOLDE_URL}/${idPieza}`);
    }

    addPiezaMolde(dto: { idMolde: number, idPieza: number, observaciones: string }): Observable<any> {
        return this.http.post(this.API_PIEZA_MOLDE_URL, dto);
    }

    deletePiezaMolde(idPiezaMolde: number): Observable<any> {
        return this.http.delete(`${this.API_PIEZA_MOLDE_URL}/${idPiezaMolde}`);
    }

    getInsumosTratadosPorPieza(idPieza: number): Observable<ApiResponse<IInsumoTratado[]>> {
        return this.http.get<ApiResponse<IInsumoTratado[]>>(`${this.API_INSUMO_TRATADO_URL}/pieza/${idPieza}`);
    }

    getInsumoTratadoById(id: number): Observable<ApiResponse<IInsumoTratado>> {
        return this.http.get<ApiResponse<IInsumoTratado>>(`${this.API_INSUMO_TRATADO_URL}/${id}`);
    }

    createInsumoTratado(dto: any): Observable<any> {
        return this.http.post(this.API_INSUMO_TRATADO_URL, dto);
    }

    updateInsumoTratado(id: number, dto: any): Observable<any> {
        return this.http.put(`${this.API_INSUMO_TRATADO_URL}/${id}`, dto);
    }

    deleteInsumoTratado(id: number): Observable<any> {
        return this.http.delete(`${this.API_INSUMO_TRATADO_URL}/${id}`);
    }

    updateMoldeo(idProceso: number, moldeoData: any): Observable<any> {
        return this.http.put(`${this.API_BASE_URL}proceso/moldeo/${idProceso}`, moldeoData);
    }

    updateDesmoldantePostcura(idProceso: number, data: { desmoldante: string, postCura: string }): Observable<any> {
        return this.http.put(`${this.API_BASE_URL}proceso/desmoldantepostcura/${idProceso}`, data);
    }

    getEsquemas(idProceso: number): Observable<ApiResponse<Esquema[]>> {
        return this.http.get<ApiResponse<Esquema[]>>(`${this.API_ESQUEMA_URL}/${idProceso}`);
    }

    createEsquema(esquemaData: any): Observable<any> {
        return this.http.post(this.API_ESQUEMA_URL, esquemaData);
    }

    updateEsquema(idEsquema: number, esquemaData: any): Observable<any> {
        return this.http.put(`${this.API_ESQUEMA_URL}/${idEsquema}`, esquemaData);
    }

    deleteEsquema(idEsquema: number): Observable<any> {
        return this.http.delete(`${this.API_ESQUEMA_URL}/${idEsquema}`);
    }

    getTerminacion(idProceso: number): Observable<ApiResponse<Finalizacion>> {
        return this.http.get<ApiResponse<Finalizacion>>(`${this.API_TERMINACION_URL}/${idProceso}`);
    }

    updateTerminacion(idProceso: number, data: any): Observable<any> {
        return this.http.put(`${this.API_TERMINACION_URL}/${idProceso}`, data);
    }

    getDimensionesPorPieza(idPieza: number): Observable<ApiResponse<PiezaDimension[]>> {
        return this.http.get<ApiResponse<PiezaDimension[]>>(`${this.API_PIEZA_DIMENSION_URL}/${idPieza}`);
    }

    agregarDimensionAPieza(dto: any): Observable<any> {
        return this.http.post(this.API_PIEZA_DIMENSION_URL, dto);
    }

    actualizarDimensionDePieza(id: number, dto: any): Observable<any> {
        return this.http.put(`${this.API_PIEZA_DIMENSION_URL}/${id}`, dto);
    }

    eliminarDimensionDePieza(id: number): Observable<any> {
        return this.http.delete(`${this.API_PIEZA_DIMENSION_URL}/${id}`);
    }

    getClientesPorPieza(idPieza: number): Observable<ApiResponse<PiezaCliente[]>> {
        return this.http.get<ApiResponse<PiezaCliente[]>>(`${this.API_PIEZA_CLIENTE_URL}/${idPieza}`);
    }

    agregarClienteAPieza(dto: any): Observable<any> {
        return this.http.post(this.API_PIEZA_CLIENTE_URL, dto);
    }

    actualizarClienteDePieza(idAsociacion: number, dto: any): Observable<any> {
        return this.http.put(`${this.API_PIEZA_CLIENTE_URL}/${idAsociacion}`, dto);
    }

    eliminarClienteDePieza(idAsociacion: number): Observable<any> {
        return this.http.delete(`${this.API_PIEZA_CLIENTE_URL}/${idAsociacion}`);
    }

    getPlanos(idPieza: number): Observable<ApiResponse<Plano[]>> {
        return this.http.get<ApiResponse<Plano[]>>(`${this.API_PIEZA_PLANO_URL}/${idPieza}`);
    }

    uploadPlano(dto: any): Observable<any> {
        return this.http.post(this.API_PIEZA_PLANO_URL, dto);
    }

    downloadPlano(idPlano: number): Observable<ApiResponse<{ archivo: string, nombre: string }>> {
        return this.http.get<ApiResponse<{ archivo: string, nombre: string }>>(`${this.API_PIEZA_PLANO_URL}/download/${idPlano}`);
    }

    deletePlano(idPlano: number): Observable<any> {
        return this.http.delete(`${this.API_PIEZA_PLANO_URL}/${idPlano}`);
    }

    getPiezaTipo(): Observable<{ id: number; nombre: string }[]> {
        return this.http.get<any>(this.API_PIEZA_TIPO_URL).pipe(map(response => response.data || []));
    }

    getFormulas(): Observable<{ id: number; nombre: string }[]> {
        return this.http.get<any>(`${this.API_BASE_URL}formula`).pipe(map(response => response.data || []));
    }

    getPrensas(): Observable<Prensa[]> {
        return this.http.get<ApiResponse<Prensa[]>>(this.API_PRENSA_URL).pipe(
            map(response => response.data || [])
        );
    }

    getTiposBombeo(): Observable<string[]> {
        return of(['AUTOMATICO', 'ESCALONADO']);
    }

    getTiposDimension(): Observable<string[]> {
        return of(['ALTO', 'ANCHO', 'PROFUNDIDAD', 'DIAMETRO']);
    }

    getTiposInsumo(): Observable<ApiResponse<ITipoInsumoJerarquico[]>> {
        return this.http.get<ApiResponse<ITipoInsumoJerarquico[]>>(this.API_TIPO_INSUMO_URL);
    }

    getInsumosPorTipo(idTipo: number): Observable<ApiResponse<IPaginatedResponse<Insumo>>> {
        const params = new HttpParams()
            .set('idTipo', idTipo.toString())
            .set('rows', '9999');
        return this.http.get<ApiResponse<IPaginatedResponse<Insumo>>>(this.API_INSUMO_URL, { params });
    }

    buscarTratamientos(nombre: string): Observable<ApiResponse<ITratamiento[]>> {
        const params = new HttpParams().set('nombre', nombre);
        return this.http.get<ApiResponse<ITratamiento[]>>(this.API_TRATAMIENTO_URL, { params });
    }

    buscarAdhesivos(nombre: string): Observable<ApiResponse<IAdhesivo[]>> {
        const params = new HttpParams().set('nombre', nombre);
        return this.http.get<ApiResponse<IAdhesivo[]>>(this.API_ADHESIVO_URL, { params });
    }

    triggerAction(): void {
        this.actionSubject.next();
    }

    updateButtonState(state: any) {
        this.buttonStateSubject.next(state);
    }

    public resetButtonState(): void {
        this.buttonStateSubject.next({
            mostrarBotonEdicion: false,
            botonEdicionTexto: '',
            nombrePieza: ''
        });
    }
}