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
    nroBoca: number
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