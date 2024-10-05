export interface IResponse<Data> {
  status: string;
  data: Data;
}

export interface IMachine {
  id?: number;
  nombre?: string;
  estado?: string;
  posicion?: number;
  observacionesReporte?: string;
  idMaquina?: number;
}

export type IMachineResponse = IResponse<IMachine[]>;
