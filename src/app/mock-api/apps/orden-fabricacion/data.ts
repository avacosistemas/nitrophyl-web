import * as moment from 'moment';

export const ordenesFabricacion = [
    {
        id: 1,
        nroOrden: '8548',
        idCliente: 1,
        clienteNombre: 'Raúl',
        fecha: moment().subtract(10, 'days').format('YYYY-MM-DD'),
        estado: 'FINALIZADA',
        
        ordenCompraId: 1,
        ordenCompraNro: '11199', 
        ordenCompraFecha: moment().subtract(15, 'days').format('YYYY-MM-DD'),
        
        prensa: '17',
        operario: 'Martin',
        fechaEstimada: moment().subtract(2, 'days').format('YYYY-MM-DD'),
        fechaEntregada: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        piezas: [
            {
                id: 1,
                idPieza: 1,
                codigoPieza: 'PZ-001',
                nombrePieza: 'Cuerito', 
                formula: 'TO',          
                cantidadSolicitada: 150,
                cantidadAFabricar: 150,
                stockActual: 0,
                cotizacionValor: 150.75,
                cotizacionFecha: '2023-01-15'
            }
        ]
    },
    {
        id: 2,
        nroOrden: '8547',
        idCliente: 1,
        clienteNombre: 'Marcelo',
        fecha: moment().subtract(3, 'days').format('YYYY-MM-DD'),
        estado: 'EN_PROCESO',
        
        ordenCompraId: 2,
        ordenCompraNro: '11153',
        ordenCompraFecha: moment().subtract(5, 'days').format('YYYY-MM-DD'),
        
        prensa: '14',
        operario: 'Roberto',
        fechaEstimada: moment().add(2, 'days').format('YYYY-MM-DD'),
        fechaEntregada: null,
        piezas: [
            {
                id: 2,
                idPieza: 3,
                codigoPieza: 'PZ-003',
                nombrePieza: 'Diafragma',
                formula: 'BE',
                cantidadSolicitada: 50,
                cantidadAFabricar: 20,
                stockActual: 30
            }
        ]
    },
    {
        id: 3,
        nroOrden: '8549',
        idCliente: 2,
        clienteNombre: 'Juancito',
        fecha: moment().format('YYYY-MM-DD'),
        estado: 'PENDIENTE',
        
        ordenCompraId: null,
        ordenCompraNro: '11141',
        ordenCompraFecha: moment().format('YYYY-MM-DD'),
        
        prensa: null,
        operario: null,
        fechaEstimada: null,
        fechaEntregada: null,
        piezas: [
            {
                id: 3,
                idPieza: 4,
                codigoPieza: 'PZ-004',
                nombrePieza: 'Tapon',
                formula: 'NK',
                cantidadSolicitada: 20,
                cantidadAFabricar: 0,
                stockActual: 10
            }
        ]
    }
];

export const piezas = [
    { id: 1, codigo: 'PZ-001', denominacion: 'Cuerito', idCliente: 1, formula: 'TO' },
    { id: 2, codigo: 'PZ-002', denominacion: 'Pieza Cliente A sin Cot', idCliente: 1, formula: 'XX' },
    { id: 3, codigo: 'PZ-003', denominacion: 'Diafragma', idCliente: null, formula: 'BE' },
    { id: 4, codigo: 'PZ-004', denominacion: 'Tapon', idCliente: 2, formula: 'NK' },
];

export const stockPiezas = [
    { idPieza: 1, stock: 0 },
    { idPieza: 2, stock: 5 },
    { idPieza: 3, stock: 30 },
    { idPieza: 4, stock: 100 },
];

export const cotizacionesPiezas = [
    { idPieza: 1, idCliente: 1, tieneCotizacion: true, valor: 150.75, fecha: '2023-01-15' },
    { idPieza: 2, idCliente: 1, tieneCotizacion: false },
    { idPieza: 4, idCliente: 2, tieneCotizacion: true, valor: 200, fecha: '2022-11-20' },
];
