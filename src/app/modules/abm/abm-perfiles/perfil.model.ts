import { Rol } from "../abm-roles/rol.model";
import { Permiso } from "../abm-permisos/permiso.model";

export interface Perfil {
    enabled: boolean,
    id: number,
    name: string,
    permissions: Array<Permiso>,
    role: Rol,
}