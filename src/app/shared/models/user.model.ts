import { Perfil } from "./perfil.model"

export interface User {
    email: string,
    enabled: boolean,
    id: number,
    lastname: string,
    name: string,
    profiles: Array<Perfil>
    username: string
}

export interface UserList {
    status: string,
    data: Array<User>
}

export interface UserResponse {
    status: string,
    data: User
}