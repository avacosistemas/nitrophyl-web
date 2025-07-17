export interface ITratamiento {
    id: number;
    nombre: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface ITratamientoApiResponse {
    status: string;
    data: ITratamiento[];
}

export interface ITratamientoSingleApiResponse {
    status: string;
    data: ITratamiento;
}

export interface ITratamientoDto {
    nombre: string;
}

export interface IErrorResponse {
    status: string;
    data: string;
}