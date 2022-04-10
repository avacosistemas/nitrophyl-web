export interface User {
    email: string,
    enabled: boolean, //true
    id: number, //0
    lastname: string,
    name: string,
    profiles: [ // traer de profiles
        {
        enabled: boolean,
        id: number,
        name: string,
        permissions: [
            {
                code: string,
                description: string,
                enabled: boolean,
                id: number
            }
        ],
        role: {
            code: string,
            id: number,
            name: string
        }
        }
    ],
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