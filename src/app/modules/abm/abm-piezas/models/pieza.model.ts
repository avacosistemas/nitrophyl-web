export interface ApiResponse<T> {
    status: string;
    data: T;
}

export interface IPaginatedResponse<T> {
    page: T[];
    totalReg: number;
}

export interface Pieza {
    id: number;
    vigente: boolean;
    codigo: string;
    denominacion: string;
    tipo?: string;
    material: string;
    formula?: string;
    revision: number;
    fechaRevision: number;
    puedeMarcarVigente: boolean;
    puedeGenerarRevision: boolean;
}

export interface Espesor {
    min: number;
    max: number;
}

export interface PiezaProceso {
    id: number;
    denominacion: string;
    tipo: string;
    codigo: string;
    nombreFormula: string;
    durezaMinima: number;
    durezaMaxima: number;
    unidadDureza: 'SHORE_A' | 'SHORE_D';
    espesores: Espesor[];
    pesoCrudo: number | null;
    observacionesPesoCrudo: string | null;
    revision: number;
    fechaRevision: number;
    vigente: boolean;
    fechaCreacionPiezaProceso: number;
    observacionesRevision: string | null;
    precalentamientoValor: number | null;
    precalentamientoUnidad: string | null;
    prensas: Prensa[];
    vulcanizacionTiempo: number;
    vulcanizacionTemperaturaMin: number;
    vulcanizacionTemperaturaMax: number;
    bombeos: Bombeo[];
    desmoldante: string | null;
    postCura: string | null;
}

export interface PiezaCreateDTO {
    codigo: string;
    denominacion: string;
    durezaMaxima: number;
    durezaMinima: number;
    espesores: Espesor[];
    idCliente: number;
    idFormula: number;
    idMolde: number;
    idTipoPieza: number;
    nombrePiezaCliente?: string;
    cotizacionCliente?: number;
    observacionesCotizacionCliente?: string;
    observacionesMolde?: string;
    observacionesPesoCrudo?: string;
    pesoCrudo: number | null;
    planoArchivo?: string;
    planoClasificacion?: string;
    planoCodigo?: string;
    planoObservaciones?: string;
    planoRevision?: number;
    revisionIncial: number;
    unidadDureza: string;
}

export interface PiezaUpdateDTO {
    denominacion: string;
    idTipoPieza: number;
    idFormula: number;
    durezaMinima: number;
    durezaMaxima: number;
    unidadDureza: string;
    espesores: Espesor[];
    pesoCrudo: number | null;
    observacionesPesoCrudo: string | null;
    observacionesRevision: string | null;
}

export interface PiezaCliente {
    id: number;
    idCliente: number;
    idPieza: number;
    codigoCliente: string;
    nombreCliente: string;
    nombrePiezaPersonalizado: string;
    cotizacion?: number;
    fechaCotizacion?: string;
    observacionesCotizacion?: string;
}

export interface PiezaDimension {
    id: number;
    idPieza: number;
    tipo: string;
    valor: number;
    observaciones?: string;
}

export interface Plano {
    id: number;
    idPieza: number;
    archivo?: string | null;
    codigo: string;
    revision: number;
    clasificacion: string;
    observaciones: string;
    nombreArchivo?: string;
    fecha?: string;
    safeUrl?: any;
}

export interface Molde {
    id: number;
    nombre: string;
}

export interface IPiezaMolde {
    id: number;
    idMolde: number;
    idPieza: number;
    codigo: string;
    observaciones: string | null;
}

export interface Moldeo {
    prensaSeleccionada: Prensa[];
    precalentamientoHabilitado: boolean;
    precalentamientoTiempo?: number | null;
    precalentamientoUnidad?: string;
    vulcanizacionTiempo: number;
    vulcanizacionTemperaturaMinima: number;
    vulcanizacionTemperaturaMaxima: number;
    bombas: Bombeo[];
}

export interface Prensa {
    id: number;
    nombre: string;
}

export interface Bombeo {
    id?: number;
    tipo: 'AUTOMATICO' | 'ESCALONADO';
    cantidad: number;
    presion: number;
}

export interface Insumo {
    id: number;
    nombre: string;
    idTipo: number;
    tipoNombre: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface IInsumoTratado {
    id: number;
    idPieza: number;
    insumo: string;
    idInsumo: number;
    tipo: ITipoInsumoJerarquico;
    medidaValor: string;
    medidaObservaciones: string;
    observaciones: string | null;
    tratamientos: ITratamiento[];
    adhesivos: IAdhesivo[];
}

export interface ITipoInsumoJerarquico {
    id: number;
    nombre: string;
    padre: ITipoInsumoJerarquico | null;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface IAdhesivo {
    id: number;
    nombre: string;
}

export interface ITratamiento {
    id: number;
    nombre: string;
}

export interface Esquema {
    id: number;
    idProceso?: number;
    titulo: string;
    pasos?: PasoEsquema[];
    imagen?: string;
    safeImagenUrl?: any;
}

export interface PasoEsquema {
    id?: number;
    paso: number;
    descripcion: string;
}

export interface Finalizacion {
    id?: number;
    idProceso?: number;
    refilado: string;
    identificacion: string;
    embalaje: string;
    imagenTerminada?: string;
    safeImageUrl?: any;
}