/**
 * Metadatos de paginación recibidos en el response del backend
 */
export interface TablePageMetadata {
    totalReg: number;
    page?: number | null;
    pageSize?: number | null;
    search?: string | null;
}

/**
 * Estructura estándar del response de endpoints de listado / tablas
 */
export interface TableApiResponse<T = any> {
    status: string;
    data: T[];
    ok?: boolean | null;
    error?: string | null;
    page?: TablePageMetadata | null;
}

/**
 * Parámetros para consultas paginadas y filtradas
 */
export interface TableQueryParams {
    page?: number;
    pageSize?: number;
    pageIndex?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc' | '' | boolean;
    search?: string | null;
    first?: number;
    rows?: number;
    idx?: string;
    asc?: boolean;
    filters?: { [key: string]: any };
    [key: string]: any;
}

/**
 * Resultado normalizado y seguro listo para ser consumido por componentes de tabla
 */
export interface NormalizedTableResult<T = any> {
    items: T[];
    total: number;
    data: T[];
    totalReg: number;
    pageIndex: number;
    pageSize: number;
    search: string | null;
    rawResponse: any;
}
