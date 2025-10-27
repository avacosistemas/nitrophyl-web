export interface IMateriaPrima {
    id: number;
    nombre: string;
    cantidadStock: number;
    unidadMedidaStock: string;
}

export interface IMateriaPrimaApiResponse {
    status: string;
    data: {
        page: IMateriaPrima[];
        totalReg: number;
    };
}