import { IResponse } from './response.interface';

export interface IConfigTest {
  id: number;
  idMaquina: number;
  idFormula: number;
  fecha: string;
  maquina: string;
  condiciones: [];
  parametros: IParams[];
  revision: number;
}

export interface ICondiciones {
  id: number;
  nombre: string;
  valor: number;
}

export interface IParams {
  id: number;
  maquinaPrueba: {
    id: number;
    nombre: string;
  };
  minimo: number;
  maximo: number;
  resultado?: number;
  redondeo?: number;
  nombre?: string;
}

export type IConfigTestsResponse = IResponse<IConfigTest[]>;
export type IConfigTestResponse = IResponse<IConfigTest>;
