export interface MaquinaPrueba {
    id: number;
    idMaquina: number;
    nombre: string;
    posicion: number;
}

export interface MaquinaPruebaResponse {
    status: string;
    data: MaquinaPrueba[];
}
