export interface IStockPieza {
  fechaActualizacion: string;
  id: number;
  codigo: string;
  denominacion: string;
  tipo: string;
  material: string;
  formula: string;
  stockFisico: number;
  stockReservado: number;
}

export interface IStockPiezaResponse {
  status: string;
  data: {
    page: IStockPieza[];
    totalReg: number;
  };
}

export interface IStockMovimiento {
  id: number;
  piezaNombre: string;
  cantidad: number;
  fecha: string;
  observacion: string;
  origen: string;
}

export interface IStockMovimientoResponse {
  status: string;
  data: {
    page: IStockMovimiento[];
    totalReg: number;
  };
}
