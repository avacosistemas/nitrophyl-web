export interface IMateriaPrima {
  id: number;
  nombre: string;
  cantidadStock: number;
  unidadMedidaStock: 'G' | 'KG';
  usuarioCreacion?: string;
  fechaCreacion?: number;
  usuarioActualizacion?: string;
  fechaActualizacion?: number;
}

export interface IMateriaPrimaApiResponse {
  status: string;
  data: {
    page: IMateriaPrima[];
    totalReg: number;
  };
}

export interface IMateriaPrimaSingleApiResponse {
  status: string;
  data: IMateriaPrima;
}

export interface IErrorResponse {
  status: string;
  data: string;
}

export type TipoMovimientoStock = 'STOCK_INICIAL' | 'INGRESO' | 'DESPERDICIO' | 'RECUENTO_ANUAL';

export interface IMateriaPrimaStockHistorial {
  id?: number;
  cantidad: number;
  tipo: TipoMovimientoStock;
  unidadMedida: 'G' | 'KG';
  fecha: string;
  idMateriaPrima?: number;
  materiaPrimaNombre?: string;
  usuarioCreacion?: string;
  fechaCreacion?: number;
  usuarioActualizacion?: string;
  fechaActualizacion?: number;
}

export interface IMateriaPrimaStockHistorialApiResponse {
    status: string;
    data: {
        page: IMateriaPrimaStockHistorial[];
        totalReg: number;
    };
}

export interface ICreateMateriaPrimaStock {
    cantidad: number;
    fecha: string;
    idMateriaPrima: number;
    tipo: TipoMovimientoStock;
}