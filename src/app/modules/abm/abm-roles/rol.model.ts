export interface Rol {
    code: string;
    id: number;
    name: string;
}

export interface Roles {
    status: string;
    data: Array<Rol>;
    ok?: boolean;
    error?: any;
    page?: any;
}

export interface RolRespuesta {
    status: string;
    data: Rol;
    ok?: boolean;
    error?: any;
    page?: any;
}