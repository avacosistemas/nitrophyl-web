export interface ResultadoEnsayo {
    idMaquinaPrueba: number;
    redondeo: number;
    resultado: number;
    estadoEnsayo: string;
}

export interface Lote {
    row: number;
    idLote: number;
    nroLote: string;
    fecha: string;
    observaciones: string;
    idFormula: number;
    nombreFormula: string;
    estadoLote: string;
    resultados: ResultadoEnsayo[];
    id: number;
}

export interface LotePorMaquinaResponse {
    status: string;
    data: {
        page: Lote[];
        totalReg: number;
    };
}

export interface ILotePorMaquinaReporteParams {
    asc?: boolean;
    estadoLote?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    first?: number;
    idFormula?: number;
    idMaquina?: number;
    idx?: string;
    nroLote?: string;
    rows?: number;
}

export interface LoteConResultadosCombinados extends Lote {
    resultadosCombinados: { valor: number | null; id: number | null }[];
}

export interface ILotePorMaquinaReporteParams {
    asc?: boolean;
    estadoLote?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    first?: number;
    idFormula?: number;
    idMaquina?: number;
    idx?: string;
    nroLote?: string;
    rows?: number;
}

export interface ResultadoCombinado {
    valor: string | null;
    id: number | null;
}

export interface LoteConResultadosCombinadosExtend extends LoteConResultadosCombinados {
    resultadoGeneral: string | null;
    redondeoGeneral: string | null;
}