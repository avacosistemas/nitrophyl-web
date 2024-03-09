export interface IResponse<Data> {
  status: string;
  data: Data;
}

export interface IMachine {
  id?: number;
  nombre?: string;
  estado?: string;
  observacionesReporte?: string;
}

export type IMachineResponse = IResponse<IMachine[]>;
