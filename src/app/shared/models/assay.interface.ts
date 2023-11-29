import { IResponse } from './response.interface';

export interface IAssay {
  id?: number;
  observaciones: string;
  formula?: string;
  idFormula: number;
  fecha?: string;
  nroLote: string;
}

export interface IAssayCreate {
  idConfiguracionPrueba: number;
  observaciones: string;
  resultados: IAssayResult[];
}

export interface IAssayResult {
  idConfiguracionPruebaParametro: number;
  redondeo: number;
  resultado: number;
}

export type IAssaysResponse = IResponse<IAssay[]>;
export type IAssayResponse = IResponse<IAssay>;
