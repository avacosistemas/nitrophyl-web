export interface UserProfileRef {
    id: number;
    name?: string;
    role?: any;
    permissions?: any[];
    enabled?: boolean;
}

export interface User {
    id: number;
    username: string;
    name: string;
    lastname: string;
    email: string;
    enabled: boolean;
    admin?: boolean;
    profiles: Array<UserProfileRef>;
}

export interface UserList {
    status: string;
    data: Array<User>;
    ok?: boolean;
    error?: any;
    page?: any;
}

export interface UserResponse {
    status: string;
    data: User;
    ok?: boolean;
    error?: any;
    page?: any;
}