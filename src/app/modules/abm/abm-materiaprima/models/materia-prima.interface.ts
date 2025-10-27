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