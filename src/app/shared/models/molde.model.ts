export interface Molde {
  id: number;
  codigo: string;
  estado: string;
  nombre: string;
  observaciones: string;
  ubicacion: string;
  idClienteDuenio: number;
  clienteDuenio: string;
  propio: boolean;
  cantidadBocas?: number;
  alto?: number;
  ancho?: number;
  profundidad?: number;
  diametro?: number;
  ultimoRegistro?: string;
  piezaTipos?: { id: number, nombre: string }[];
  observacionesEstado?: string;
}

export interface ResponseMolde {
  status: string;
  data: {
    page: Molde[];
    totalReg: number;
  };
}

export interface Boca {
  id?: number;
  idMolde?: number;   
  estado: string;
  nroBoca: number;
  descripcion: string;
  observacionesEstado?: string;
}

export interface ResponseBoca {
  status: string;
  data: Array<Boca>;
}

export interface Dimension {
  tipoDimension: string;
  valor: number;
}

export interface ResponseDimension {
  status: string;
  data: Array<Dimension>;
}

export interface Planos {
  nombre: string;
  version: string;
  fecha: string;
  data?: any;
  descripcion: string;
}

export interface Plano {
  id: number;
  archivo: string;
  clasificacion: string;
  descripcion: string;
  idMolde: number;
  nombreArchivo: string;
}

export interface Fotos {
  id: number;
  archivo: string;
  nombreArchivo: string;
  version: string;
  fecha: string;
  data?: any;
  descripcion: string;
}

export interface MoldeRegistro {
  comentarios: string;
  fechaHora: string;
  id: number;
  idMolde: number;
  tipo: string;
}

export interface CargaArchivo {
  idMolde: number;
  nombreArchivo: string;
  archivo: any;
  descripcion?: string;
  clasificacion?: string;
}

export interface ObservacionInterface{
  usuarioCreacion: string;
  fechaCreacion: number;
  usuarioActualizacion: null;
  fechaActualizacion: null;
  id: number;
  idMolde: number;
  observacion: string;
  fecha: Date;
  usuario: string;
}