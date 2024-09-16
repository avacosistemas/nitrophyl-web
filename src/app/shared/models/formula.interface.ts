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

export type IFormulasResponse = IResponse<IFormula[]>;
export type IFormulaResponse = IResponse<IFormula>;
