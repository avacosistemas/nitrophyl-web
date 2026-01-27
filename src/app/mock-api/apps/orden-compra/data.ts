import * as moment from 'moment';

export const clients = [
    { id: 1, codigo: 'C001', nombre: 'Cliente A', email: 'clientea@test.com' },
    { id: 2, codigo: 'C002', nombre: 'Cliente B', email: 'clienteb@test.com' },
];

export const ordenesCompra = [
    {
        id: 1,
        fecha: moment().subtract(1, 'days').format('DD-MM-YYYY'),
        idCliente: 1,
        clienteNombre: 'Cliente A',
        nroComprobante: 'OC-2025-001',
        nroInterno: 'NI-001',
        estado: 'Pendiente',
        archivoNombre: 'oc_cliente_a.pdf'
    },
    {
        id: 2,
        fecha: moment().subtract(5, 'days').format('DD-MM-YYYY'),
        idCliente: 2,
        clienteNombre: 'Cliente B',
        nroComprobante: 'OC-2025-002',
        nroInterno: 'NI-002',
        estado: 'Iniciada',
        archivoNombre: 'oc_cliente_b.pdf'
    },
    {
        id: 3,
        fecha: moment().subtract(10, 'days').format('DD-MM-YYYY'),
        idCliente: 1,
        clienteNombre: 'Cliente A',
        nroComprobante: 'OC-2025-003',
        nroInterno: 'NI-003',
        estado: 'Finalizada',
        archivoNombre: null
    }
];