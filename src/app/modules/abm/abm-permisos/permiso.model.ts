export interface Permiso {
    id: number | null;
    code: string;
    description: string;
    enabled: boolean;
}

export interface RespuestaPermisos {
    status: string;
    data: Array<Permiso>;
    ok?: boolean;
    error?: any;
    page?: any;
}

export interface RespuestaPermiso {
    status: string;
    data: Permiso;
    ok?: boolean;
    error?: any;
    page?: any;
}