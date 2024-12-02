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
