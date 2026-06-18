export interface ISectorFabrica {
    id: number;
    nombre: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface ISectorFabricaApiResponse {
    status: string;
    data: ISectorFabrica[];
}

export interface ISectorFabricaSingleApiResponse {
    status: string;
    data: ISectorFabrica;
}

export interface ISectorFabricaDto {
    id?: number;
    nombre: string;
}

export interface IErrorResponse {
    status: string;
    data: string;
}
