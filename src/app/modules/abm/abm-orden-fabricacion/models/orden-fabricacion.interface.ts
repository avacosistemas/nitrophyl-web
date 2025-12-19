export interface IOrdenFabricacion {
    id: number;
    nroOrden: string;
    clienteNombre: string;
    idCliente: number | null;
    fecha: string;
    estado: string;
    piezas: IOrdenFabricacionPieza[];
}

export interface IOrdenFabricacionPieza {
    idTemp?: number;
    id?: number;
    idPieza: number;
    codigoPieza: string;
    nombrePieza: string;
    cantidadSolicitada: number;
    stockActual: number;
    cantidadAFabricar: number;
    cotizacionValor?: number;
    cotizacionFecha?: string;
    tieneCotizacion: boolean;
}

export interface IOrdenFabricacionCreateDTO {
    idCliente: number | null;
    idOrdenCompra?: number;
    fecha: string;
    piezas: {
        idPieza: number;
        cantidadSolicitada: number;
        cantidadAFabricar: number;
        cotizacionValor?: number;
        cotizacionFecha?: string;
    }[];
}

export interface IPiezaStockInfo {
    stock: number;
}

export interface IPiezaCotizacionInfo {
    tieneCotizacion: boolean;
    valor?: number;
    fecha?: string;
}