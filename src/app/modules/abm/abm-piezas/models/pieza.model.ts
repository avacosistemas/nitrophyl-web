export interface Pieza {
    id: number;
    nombre: string;
    formula?: string;
    material?: string;
    revision?: string;
    fechaRevision?: Date;
    tipo?: string;
    vigente?: boolean;
    permiteEditar?: boolean;
    permiteGenerarRevision?: boolean;
    permiteMarcarRevision?: boolean;
    moldeId?: number;
    espesorPlanchaMin?: number;
    espesorPlanchaMax?: number;
    pesoCrudo?: number;
    observacionesPesoCrudo?: string;
    dureza?: number
    clienteId?: number;
    nombrePiezaPersonalizado?: string;
}

export interface TipoInsumo {
    id: number;
    nombre: string;
    subniveles?: TipoInsumo[];
    padre?: TipoInsumo;
}

export interface Insumo {
    id: number;
    nombre: string;
    tipoId: number;
}

export interface InsumoPieza {
    id?: number;
    tipo: TipoInsumo[];
    nombreInsumo: Insumo;
    medidaValor?: number;
    medidaObservaciones?: string;
    tratamiento?: string;
    adhesivos?: string[];
    observaciones?: string;
}

export interface Dimension {
    tipoDimension: string;
    valor: number;
    observaciones?: string;
}

export interface Prensa {
    id: number;
    nombre: string;
}

export interface Bombeo {
    cantidad: number;
    tipo: string;
    presion: number;
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

export interface DesmoldantePostCura {
    desmoldante: string;
    observacionesDesmoldante: string;
    postcura: string;
}

export interface Esquema {
    id: number;
    titulo: string;
    pasos?: string[];
    imagenBase64?: string;
    safeImagenUrl?: any;
}

export interface Finalizacion {
    refilado: string;
    identificacion: string;
    embalaje: string;
    imagenEmbalaje?: string;
}

export interface Plano {
    id?: number;
    nombreArchivo: string;
    clasificacion: string;
    descripcion: string;
    version: string;
    fecha: string;
    archivo?: string;
    codigo: string;
    revision: number;
}

export interface Molde {
    id: number;
    nombre: string;
}