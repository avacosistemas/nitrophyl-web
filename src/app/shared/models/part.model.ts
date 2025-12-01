export interface Part {
    codigoPieza: string,
    codigoInterno: string,
    nombre: string,
    esProducto?: boolean,
    id?: number,
    piezas?: Array<any>,
    tipo?: string,
};

export interface PartResponse {
    status: string,
    data: Part
}