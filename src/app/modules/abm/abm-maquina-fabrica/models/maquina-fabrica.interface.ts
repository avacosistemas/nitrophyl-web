export interface IMaquinaFabrica {
    id: number;
    idSector: number;
    nombre: string;
    sector: string;
    tipo: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface IMaquinaFabricaApiResponse {
    status: string;
    data: IMaquinaFabrica[];
}

export interface IMaquinaFabricaSingleApiResponse {
    status: string;
    data: IMaquinaFabrica;
}

export interface IMaquinaFabricaDto {
    id?: number;
    idSector: number;
    nombre: string;
    sector: string;
    tipo: string;
}

export interface IErrorResponse {
    status: string;
    data: string;
}
