export interface Molde {
    id: number,
    codigo: string,
    estado: boolean,
    nombre: string,
    observaciones: string,
    ubicacion: string,
}

export interface ResponseMolde {
    status: string,
    data: Molde
}

export interface Boca {
    estado: boolean,
    nroBoca: number,
    descripcion: string
}

export interface ResponseBoca {
    status: string,
    data: Array<Boca>
}

export interface Dimension {
    tipoDimension: string,
    valor: number
}

export interface ResponseDimension {
    status: string,
    data: Array<Dimension>
}

export interface Planos {
    nombre: string,
    version: string,
    fecha: string,
    data?: any,
    descripcion: string
}

export interface Fotos {
    nombre: string,
    version: string,
    fecha: string,
    data?: any,
    descripcion: string
}

export interface MoldeRegistro {
    comentarios: string,
    fechaHora: string,
    id: number,
    idMolde: number,
    tipo: string
}

export interface CargaArchivo {
    idMolde: number,
    nombreArchivo: string,
    archivo: any,
    descripcion?: string
}