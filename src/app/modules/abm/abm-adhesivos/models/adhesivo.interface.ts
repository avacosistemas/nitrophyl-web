export interface IAdhesivo {
    id: number;
    nombre: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface IAdhesivoApiResponse {
    status: string;
    data: IAdhesivo[];
}

export interface IAdhesivoSingleApiResponse {
    status: string;
    data: IAdhesivo;
}

export interface IAdhesivoDto {
    nombre: string;
}

export interface IErrorResponse {
    status: string;
    data: string;
}