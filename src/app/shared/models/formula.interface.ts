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
  maquinaPrueba: { id: number; nombre?: string ; idMaquina?: number ; posicion?: number };
  minimo: number;
  maximo: number;
  norma: string;
  orden?: number;
}

export interface ITestFormula {
  id?: number;
  idFormula?: number;
  idMaquina?: number;
  parametros: IConfiguracionPruebaParametro[];
  condiciones: IConditions[];
  observacionesReporte: string;
  mostrarResultadosReporte?: boolean;
}

// export interface IParams {
//   maquinaPrueba: string;
//   maximo: number | null;
//   minimo: number | null;
//   norma: string | null;
// }

export interface IConditions {
  id?: number;
  nombre: string;
  valor: number | null;
}

export interface ITestTitle {
  fecha: Date;
  fechaHasta?: string;
  id: number;
  idMaterial: number;
  material: string;
  nombre: string;
  norma: string;
  version: number;
  vigencia?: boolean;
}

export type IFormulasResponse = IResponse<IFormula[]>;
export type IFormulaResponse = IResponse<IFormula>;
