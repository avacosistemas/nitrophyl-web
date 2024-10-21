import { IResponse } from './response.interface';

export interface IFormula {
  labelCombo?: any;
  id?: number;
  nombre?: string;
  idMaterial?: number;
  material?: string;
  version?: number;
  fecha?: string;
  norma?: string;
  observaciones?: string;
}

export interface IConfiguracionPruebaParametro
{ id: number;
  maquinaPrueba: { id: number; nombre: string };
  minimo: number;
  maximo: number;
  norma: string;
}

export interface ITestFormula {
  idFormula: number;
  idMaquina: number;
  parametros: IConfiguracionPruebaParametro[];
  condiciones: IConditions[];
  observacionesReporte: string;
  mostrarResultadosReporte: boolean;
}

// export interface IParams {
//   maquinaPrueba: string;
//   maximo: number | null;
//   minimo: number | null;
//   norma: string | null;
// }

export interface IConditions {
  nombre: string;
  valor: number;
}

export interface ITestTitle {
  fecha: Date;
  id: number;
  idMaterial: number;
  material: string;
  nombre: string;
  norma: string;
  version: number;
}

export type IFormulasResponse = IResponse<IFormula[]>;
export type IFormulaResponse = IResponse<IFormula>;
