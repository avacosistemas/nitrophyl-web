export interface Product {
    codigoPieza: string,
    codigoInterno: string,
    nombre: string,
    esProducto?: boolean,
    id?: number,
    piezas?: Array<any>,
    tipo?: string
};

export interface ProductResponse {
    status: string,
    data: Product
}