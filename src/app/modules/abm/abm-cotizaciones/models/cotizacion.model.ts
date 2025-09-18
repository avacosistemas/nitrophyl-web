export interface ICotizacion {
    id: number;
    pieza: string;
    material: string;
    cliente: string;
    valor: number;
    fecha: string;
    observaciones: string;
}

export interface ICotizacionApiResponse {
    status: string;
    data: {
        page: ICotizacion[];
        totalReg: number;
    };
}

export interface ICotizacionCreateDTO {
    idCliente: number;
    idPieza: number;
    valor: number;
    fecha: string;
    observaciones: string;
}