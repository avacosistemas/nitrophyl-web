import { IResponse } from './response.interface';

export interface IFormula {
  id?: number;
  nombre?: string;
  idMaterial?: number;
  material?: string;
  version?: number;
  fecha?: string;
}

export type IFormulasResponse = IResponse<IFormula[]>;
export type IFormulaResponse = IResponse<IFormula>;
