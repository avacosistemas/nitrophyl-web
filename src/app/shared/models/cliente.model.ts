export interface Cliente {
    id: number,
    razonSocial: string;
    mail: string;
    cuit: number;
    direccion: string;
    codigoPostal: string;
    localidad: string;
    telefono: string;
    celular: string;
    pagina: string;
    ingresosBrutos: string;
    contacto?: any
}

export interface Contacto {
    id: number,
    tipo: string,
    nombre: string,
    mail: string,
    telefono: string
}