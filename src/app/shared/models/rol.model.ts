export interface Rol {
    code: string,
    id: number,
    name: string
}

export interface Roles {
    status: string,
    data: Array<Rol>
}

export interface RolRespuesta {
    status: string,
    data: Rol
}