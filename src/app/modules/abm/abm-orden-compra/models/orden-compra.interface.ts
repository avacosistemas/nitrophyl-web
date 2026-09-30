export interface IOrdenCompra {
    id: number;
    idCliente: number;
    cliente: string;
    comprobante: string;
    fecha: string;
    estado: string;
    archivoNombre?: string;
    metodoDespacho?: string;
    observaciones?: string;
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
    id?: number | null;
    generarOrdenFabrica?: boolean;
    observaciones?: string;
    archivo?: {
        archivo: string | null;
        nombre: string | null;
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
        descuento?: number | null;
        observacion?: string | null;
        observacionDescuento?: string | null;
        entregasSolicitadas: {
            id?: number;
            cantidad: number;
            fechaEntregaSolicitada: string;
        }[];
    }[];
}

export interface IOrdenCompraPendiente {
    comprobante: string;
    fechaOC: string;
    cliente: string;
    pieza: string;
    cantidad: number;
    formula: string;
    fechaEntrega: string;
}

export interface IOrdenCompraPendientesParams {
    page?: number;
    pageSize?: number;
    first?: number;
    rows?: number;
    asc: boolean;
    idx: string;
    comprobante?: string;
    estado?: string;
    idCliente?: number;
    idPieza?: number;
    fechaDesde?: string;     
    fechaHasta?: string;        
    fechaEntregaDesde?: string; 
    fechaEntregaHasta?: string; 
}

export interface IOrdenCompraApiResponse<T> {
    status: string;
    data: any;
    page?: {
        totalReg: number;
        page: number;
        pageSize: number;
        search?: string | null;
    };
    ok?: boolean;
    error?: any;
}