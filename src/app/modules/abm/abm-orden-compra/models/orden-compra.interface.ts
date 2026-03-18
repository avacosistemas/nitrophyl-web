export interface IOrdenCompra {
    id: number;
    idCliente: number;
    cliente: string;
    comprobante: string;
    fecha: string;
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
    fechaEntrega?: string;
}

export interface IOrdenCompraCreateDTO {
    archivo: {
        archivo: string;
        nombre: string;
    };
    cliente?: string;
    idCliente: number;
    comprobante: string;
    fecha: string;
    detalle: {
        idPieza: number;
        pieza?: string;
        idCotizacion?: number | null;
        fechaCotizacion?: string | null;
        valorCotizacion?: number | null;
        entregasSolicitadas: {
            cantidad: number;
            fechaEntregaSolicitada: string;
        }[];
    }[];
}

export interface IOrdenCompraApiResponse {
    status: string;
    data: {
        page: IOrdenCompra[];
        totalReg: number;
    };
}