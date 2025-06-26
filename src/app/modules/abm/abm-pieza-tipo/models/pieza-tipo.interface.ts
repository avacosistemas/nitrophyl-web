export interface IPiezaTipo {
  id: number;
  nombre: string;
  usuarioCreacion?: string;
  fechaCreacion?: number;
  usuarioActualizacion?: string;
  fechaActualizacion?: number;
}

export interface IPiezaTipoApiResponse {
  status: string;
  data: IPiezaTipo[];
}

export interface IPiezaTipoSingleApiResponse {
  status: string;
  data: IPiezaTipo;
}

export interface IErrorResponse {
    status: string;
    data: string;
}