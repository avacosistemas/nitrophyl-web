export interface Permiso {
    id: number,
    code: string,
    description: string,
    enabled: boolean
}

export interface RespuestaPermisos {
    status: string,
    data: Array<Permiso>
}

export interface RespuestaPermiso {
    status: string,
    data: Permiso
}