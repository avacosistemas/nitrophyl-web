import { IResponse } from "../../../shared/models/response.interface";

export interface IConfiguracion {
  id?: number;
  idCliente?: number;
  idFormula?: number;
  idMaquina?: number;
  mostrarCondiciones?: boolean;
  mostrarObservacionesParametro?: boolean;
  mostrarParametros?: boolean;
  mostrarResultados?: boolean;
  cliente?: string;
  formula?: string;
  maquina?: string;
  idsPruebas?: number[];
  enviarGrafico?: boolean;
  page?: number;
  pageSize?: number;
  asc?: boolean;
  idx?: string;
}

export type IConfiguracionesData = IConfiguracion[] | {
  page: IConfiguracion[];
  totalReg: number;
};

export type IConfiguracionesResponse = IResponse<IConfiguracionesData>;
export type IConfiguracionResponse = IResponse<IConfiguracion>;