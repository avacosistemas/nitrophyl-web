import { IResponse } from './response.interface';

export interface ILot {
  id?: number;
  observaciones: string;
  formula?: string;
  idFormula: number;
  fecha?: Date;
  fechaEstado?: string;
  nroLote: string;
}

export type ILotsResponse = IResponse<ILot[]>;
export type ILotResponse = IResponse<ILot>;
