
export interface Pieza {
    id: number;
    vigente: boolean;
    codigo: string;
    denominacion: string;
    tipo?: string;
    material: string;
    formula?: string;
    molde?: string;
    idMolde?: number;
    clienteId?: number;
    nombreCliente?: string;
    nombrePiezaPersonalizado?: string;
    dureza?: number;
    unidadDureza?: string;
    durezaMinima?: number;
    durezaMaxima?: number;
    espesorPlanchaMin?: number;
    espesorPlanchaMax?: number;
    pesoCrudo?: number;
    observacionesPesoCrudo?: string;
    observacionesMolde?: string;
    revision: number;
    fechaRevision: number;
    observacionesRevision?: string;
    puedeMarcarVigente: boolean;
    puedeGenerarRevision: boolean;
}

export interface PiezaNombreResponse {
  status: string;
  data: {
    page: Pieza[];
    totalReg: number;
  };
}

export interface PiezaCliente {
    id: number;
    idCliente: number;
    idPieza: number;
    nombreCliente: string;
    nombrePiezaCliente: string;
    fechaCreacion?: string;
    fechaActualizacion?: string;
    usuarioCreacion?: string;
    usuarioActualizacion?: string;
}

export interface Dimension {
    tipoDimension: string;
    valor: number;
    observaciones?: string;
}

export interface PiezaDimension extends Dimension {
    id: number;
    idPieza: number;
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