export interface IOrdenCompra {
    id: number;
    idCliente: number;
    cliente: string;
    comprobante: string;
    fecha: string;
    estado: string;
    archivoNombre?: string;
    metodoDespacho?: string;
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
    id?: number;
    archivo: {
        archivo: string;
        nombre: string;
    };
    cliente?: string;
    idCliente: number;
    comprobante: string;
    fecha: string;
    tipoDespacho: string;
    idDomicilioEnvio?: number;
    idEmpresaTransporte?: number;
    mediosEnvio?: string[];
    detalle: {
        id?: number;
        idPieza: number;
        pieza?: string;
        idCotizacion?: number | null;
        fechaCotizacion?: string | null;
        valorCotizacion?: number | null;
        entregasSolicitadas: {
            id?: number;
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