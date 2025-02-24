import { IResponse } from './response.interface';

export interface ILot {
  id?: number;
  observaciones: string;
  formula?: string;
  idFormula: number;
  fecha?: string;
  fechaEstado?: string;
  nroLote: string;
  revision: number;
  material?: string;
}

export interface ILotAutocomplete {
  nombre: string;
  codigo: string;
}

export interface ILotResponseAutocomplete {
  status: string;
  data: ILotAutocomplete[];
}

export type ILotsResponse = IResponse<ILot[]>;
export type ILotResponse = IResponse<ILot>;

export interface IInformeLoteData {
  id: number;
  observaciones: string;
  formula: string;
  formulaSimple: string;
  idFormula: number;
  fecha: string;
  nroLote: string;
  observacionesEstado: string | null;
  fechaEstado: string;
  estado: string;
  revision: number;
  material: string;
}

export interface IInformeLoteBody {
  status: string;
  data: IInformeLoteData;
}

export interface IInformeLoteResponseData {
  headers: any;
  body: IInformeLoteBody;
  statusCode: string;
  statusCodeValue: number;
}

export interface IInformeLoteResponse {
  status: string;
  data: IInformeLoteResponseData;
}
