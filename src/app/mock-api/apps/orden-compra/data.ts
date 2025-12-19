import * as moment from 'moment';

export const clients = [
    { id: 1, codigo: 'C001', nombre: 'Cliente A', email: 'clientea@test.com' },
    { id: 2, codigo: 'C002', nombre: 'Cliente B', email: 'clienteb@test.com' },
];

export const ordenesCompra = [
    {
        id: 1,
        fecha: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        idCliente: 1,
        clienteNombre: 'Cliente A',
        nroComprobante: 'OC-2025-001',
        nroInterno: 'NI-001',
        archivoNombre: 'oc_cliente_a.pdf'
    },
    {
        id: 2,
        fecha: moment().subtract(5, 'days').format('YYYY-MM-DD'),
        idCliente: 2,
        clienteNombre: 'Cliente B',
        nroComprobante: 'OC-2025-002',
        nroInterno: 'NI-002',
        archivoNombre: 'oc_cliente_b.pdf'
    },
    {
        id: 3,
        fecha: moment().subtract(10, 'days').format('YYYY-MM-DD'),
        idCliente: 1,
        clienteNombre: 'Cliente A',
        nroComprobante: 'OC-2025-003',
        nroInterno: 'NI-003',
        archivoNombre: null
    }
];