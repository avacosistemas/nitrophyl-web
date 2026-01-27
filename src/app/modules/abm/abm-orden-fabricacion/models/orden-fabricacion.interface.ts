export interface IOrdenFabricacion {
    id: number;
    nroOrden: string;
    fecha: string;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';
    ordenCompraNro: number,
    ordenCompraFecha: string,
    ocNro: string;
    ocFecha: string;
    clienteNombre: string;
    idCliente: number | null;
    piezaNombre: string;
    piezaFormula: string;
    ocCantidad: number;

    cantFabrica?: number;
    cantStock?: number;
    prensa?: string;
    operario?: string;
    fechaEstimada?: string;
    fechaEntregada?: string;

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