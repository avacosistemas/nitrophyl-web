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

export interface ResponseClientes {
    status: string,
    data: Array<Cliente>
}

export interface ResponseCliente {
    status: string,
    data: Cliente
}

export interface ResponseContactos {
    status: string,
    data: Array<Contacto>
}

export interface ResponseContacto {
    status: string,
    data: Contacto
}