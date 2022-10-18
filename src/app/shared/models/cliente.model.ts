export interface Cliente {
    id: number,
    razonSocial: string;
    email: string;
    cuit: number;
    domicilio: string;
    codigoPostal: string;
    localidad: string;
    provincia: any;
    telefonoFijo: string;
    telefonoCelular: string;
    webSite: string;
    ingresosBrutos: number;
    contacto?: any
}

export interface Contacto {
    id: number,
    idCliente: number,
    tipo: string,
    nombre: string,
    email: string,
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