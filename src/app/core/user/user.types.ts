export interface User {
    id?: string;
    guid?: string;
    name: string;
    lastname?: string;
    email?: string;
    avatar?: string;
    status?: string;
    role?: string;
    username?: string;
    passwordExpired?: boolean;
    permissions?: any[];
}
