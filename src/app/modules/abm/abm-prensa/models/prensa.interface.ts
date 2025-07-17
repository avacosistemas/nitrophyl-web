export interface IPrensa {
    id: number;
    nombre: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface IPrensaApiResponse {
    status: string;
    data: IPrensa[];
}

export interface IPrensaSingleApiResponse {
    status: string;
    data: IPrensa;
}

export interface IPrensaDto {
    nombre: string;
}

export interface IErrorResponse {
    status: string;
    data: string;
}