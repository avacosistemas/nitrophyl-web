export interface IResponse<Data> {
  status: string;
  data: Data;
}

export interface IFormula {
  id?: number;
  nombre?: string;
  idMaterial?: number;
  material?: string;
}

export interface IMaterial {
  id: number;
  nombre: string;
}

export type IFormulaResponse = IResponse<IFormula[]>;
export type IMaterialResponse = IResponse<IMaterial[]>;
