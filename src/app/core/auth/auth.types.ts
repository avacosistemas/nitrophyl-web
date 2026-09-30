export interface AuthData {
    token: string;
    name: string;
    lastname: string;
    email: string;
    role: string;
    guid: string;
    permisos: string;
    username: string;
    passwordExpired: boolean;
}

export interface AuthResponse {
    status: string;
    data: AuthData;
    ok?: any;
    error?: any;
    page?: any;
}
