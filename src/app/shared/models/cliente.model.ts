export interface Cliente {
    id: number;
    codigo?: string;
    nombre: string;
    razonSocial: string;
    email: string;
    cuit: number;
    domicilio: string;
    codigoPostal: string;
    localidad: string;
    provincia: any;
    empresa: any;
    webSite: string;
    observacionesCobranzas: string;
    observacionesEntrega: string;
    observacionesFacturacion: string;
    telefono: string;
    contacto?: any;
    activo?: boolean;
}

export interface Contacto {
    id: number;
    idCliente: number;
    tipo: string;
    nombre: string;
    email: string;
    telefono: string;
}

export interface ResponseClientes {
    status: string;
    data: Array<Cliente>;
    total?: number;
}

export interface ResponseCliente {
    status: string;
    data: Cliente;
}

export interface ResponseContactos {
    status: string;
    data: Array<Contacto>;
}

export interface ResponseContacto {
    status: string;
    data: Contacto;
}

export interface Domicilio {
    id: number;
    idCliente: number;
    domicilio: string;
    tipo: 'OTROS' | 'EXPEDICION' | 'INGENIERIA' | 'COMPRAS' | 'INFORMES' | 'CONTADURIA' | 'CALIDAD';
}

export interface ResponseDomicilios {
    status: string;
    data: Array<Domicilio>;
}

export interface ResponseDomicilio {
    status: string;
    data: Domicilio;
}
