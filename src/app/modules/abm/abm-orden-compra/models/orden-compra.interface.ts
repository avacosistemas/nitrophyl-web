export interface IOrdenCompra {
    id: number;
    fecha: string;
    clienteNombre: string;
    idCliente: number;
    nroComprobante: string;
    nroInterno: string;
    estado: string;
    archivoNombre?: string;
}

export interface IOrdenCompraItem {
    idTemp?: number;
    idPieza: number;
    codigo: string;
    denominacion: string;
    cantidad: number;
    precio: number;
    fechaCotizacion?: string;
}

export interface IOrdenCompraCreateDTO {
    fecha: string;
    idCliente: number;
    nroComprobante: string;
    nroInterno: string;
    archivoNombre?: string;
    archivoContenido?: string | null;
    items: {
        idPieza: number;
        cantidad: number;
        precio: number;
        fechaCotizacion?: string;
    }[];
}

export interface IOrdenCompraApiResponse {
    status: string;
    data: {
        page: IOrdenCompra[];
        totalReg: number;
    };
}