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
    data: Lote[] | {
        page: Lote[];
        totalReg: number;
    };
    ok?: boolean | null;
    error?: string | null;
    page?: {
        totalReg: number;
        page?: number | null;
        pageSize?: number | null;
        search?: string | null;
    } | null;
}

export interface ILotePorMaquinaReporteParams {
    asc?: boolean;
    estadoLote?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    pageSize?: number;
    first?: number;
    rows?: number;
    idFormula?: number;
    idMaquina?: number;
    idx?: string;
    nroLote?: string;
}

export interface LoteConResultadosCombinadosExtend extends Lote {
    resultadoGeneral: string | null;
    redondeoGeneral: string | null;
}