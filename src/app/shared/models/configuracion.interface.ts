import { IResponse } from "./response.interface";

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
}

export interface IConfiguracionesData {
  page: IConfiguracion[];
  totalReg: number;
}

export type IConfiguracionesResponse = IResponse<IConfiguracionesData>;
export type IConfiguracionResponse = IResponse<IConfiguracion>;