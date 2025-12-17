export interface IInsumo {
  id: number;
  nombre: string;
  origen?: 'FABRICADO' | 'COMPRADO' | 'PROVISTO';
  idTipo?: number;
  tipoNombre?: string;
  idMateriaPrima?: number;
  materiaPrimaNombre?: string;
  cantidadMateriaPrima?: number;
  observaciones?: string;
  usuarioCreacion?: string;
  fechaCreacion?: number;
  usuarioActualizacion?: string;
  fechaActualizacion?: number;
}

export interface IInsumoApiResponse {
  status: string;
  data: {
    page: IInsumo[];
    totalReg: number;
  };
}

export interface IInsumoSingleApiResponse {
  status: string;
  data: IInsumo;
}

export interface IErrorResponse {
  status: string;
  data: string;
}

export type TipoMovimientoStock = 'STOCK_INICIAL' | 'INGRESO' | 'DESPERDICIO' | 'RECUENTO_ANUAL';

export interface IInsumoStockHistorial {
  id?: number;
  cantidad: number;
  tipo: TipoMovimientoStock;
  unidadMedida: string;
  fecha: string;
  observaciones?: string;
  idInsumo?: number;
  insumoNombre?: string;
  usuarioCreacion?: string;
  fechaCreacion?: number;
  usuarioActualizacion?: string;
  fechaActualizacion?: number;
}

export interface IInsumoStockHistorialApiResponse {
  status: string;
  data: {
    page: IInsumoStockHistorial[];
    totalReg: number;
  };
}

export interface ICreateInsumoStock {
  cantidad: number;
  fecha: string;
  idInsumo: number;
  tipo: TipoMovimientoStock;
  observaciones?: string;
}