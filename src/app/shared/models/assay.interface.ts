import { IResponse } from './response.interface';

export interface IAssay {
  id?: number;
  idMaquina?: number;
  maquina?: string;
  observaciones: string;
  formula?: string;
  idFormula: number;
  fecha?: string;
  nroLote: string;
  condiciones?: ICondition[] | ICondition[];
  parametros?: IParams[] | IParams;
  idConfiguracionPrueba?: number;  // Add this line
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICondition {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IParams {}

export interface IAssayDetail {
  id: number;
  idEnsayo: number;
  idConfiguracionPruebaParametro: number;
  nombre: string;
  minimo: number;
  maximo: number;
  resultado: number;
  redondeo: number;
  norma?: string;
}

export interface IAssayCreate {
  idLote: number;
  idConfiguracionPrueba: number;
  fecha?: string;
  observaciones: string;
  resultados: IAssayResult[];
  estado: string;
}

export interface IAssayCreateWithoutResults {
  idLote: number;
  idConfiguracionPrueba: number;
}

export interface IAssayResult {
  idConfiguracionPruebaParametro: number;
  redondeo: number;
  resultado: number;
}

export type IAssaysResponse = IResponse<IAssay[]>;
export type IAssayResponse = IResponse<IAssay>;
export type IAssayDetailsResponse = IResponse<IAssayDetail[]>;
export type IAssayDetailResponse = IResponse<IAssayDetail>;