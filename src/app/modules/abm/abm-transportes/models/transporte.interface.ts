export interface ITransporte {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    horarioAtencion: string;
    observaciones: string;
    mediosEnvio: string[];
}

export interface ITransporteApiResponse {
    status: string;
    data: {
        page: ITransporte[];
        totalReg: number;
    };
}

export interface ITransporteSingleApiResponse {
    status: string;
    data: ITransporte;
}

export interface ITransporteDto {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    horarioAtencion: string;
    observaciones: string;
    mediosEnvio: string[];
}

export interface IErrorResponse {
    status: string;
    data: string;
}
