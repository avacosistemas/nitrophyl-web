import { Rol } from "../models/rol.model";
import { Permiso } from "../models/permiso.model";

export interface Perfil {
    enabled: boolean,
    id: number,
    name: string,
    permissions: Array<Permiso>,
    role: Rol,
}