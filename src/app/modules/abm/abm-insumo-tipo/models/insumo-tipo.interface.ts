export interface IInsumoTipo {
    id: number;
    nombre: string;
    padre?: IInsumoTipo;
    tipoStock?: string;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface IInsumoTipoApiResponse {
    status: string;
    data: IInsumoTipo[];
}

export interface IInsumoTipoSingleApiResponse {
    status: string;
    data: IInsumoTipo;
}

export interface IInsumoTipoDto {
    id?: number;
    nombre: string;
    padre?: {
        id: number;
    };
    tipoStock?: string;
}

export interface IErrorResponse {
    status: string;
    data: string;
}