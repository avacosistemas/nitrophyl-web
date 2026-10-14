import { Rol } from "../abm-roles/rol.model";
import { Permiso } from "../abm-permisos/permiso.model";

export interface Perfil {
    id: number | null;
    name: string;
    enabled: boolean;
    role: Rol;
    permissions: Array<Permiso>;
}

export interface RespuestaPerfiles {
    status: string;
    data: Array<Perfil>;
    ok?: boolean;
    error?: any;
    page?: any;
}

export interface RespuestaPerfil {
    status: string;
    data: Perfil;
    ok?: boolean;
    error?: any;
    page?: any;
}