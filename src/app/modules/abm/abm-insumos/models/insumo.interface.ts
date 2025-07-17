export interface IInsumo {
  id: number;
  nombre: string;
  idTipo?: number;
  tipoNombre?: string;
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