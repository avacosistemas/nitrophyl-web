export interface ITipoInsumo {
    id: number;
    nombre: string;
    padre?: ITipoInsumo;
    usuarioCreacion?: string;
    fechaCreacion?: number;
    usuarioActualizacion?: string;
    fechaActualizacion?: number;
}

export interface ITipoInsumoApiResponse {
    status: string;
    data: ITipoInsumo[];
}