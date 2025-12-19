export interface IOrdenCompra {
    id: number;
    fecha: string;
    clienteNombre: string;
    idCliente: number;
    nroComprobante: string;
    nroInterno: string;
    archivoNombre?: string;
    archivoContenido?: string;
}

export interface IOrdenCompraCreateDTO {
    fecha: string;
    idCliente: number;
    nroComprobante: string;
    nroInterno: string;
    archivoNombre?: string;
    archivoContenido?: string;
}

export interface IOrdenCompraApiResponse {
    status: string;
    data: {
        page: IOrdenCompra[];
        totalReg: number;
    };
}

export interface IOrdenCompraSingleApiResponse {
    status: string;
    data: IOrdenCompra;
}