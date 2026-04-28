export const ordenesCompra = [
    {
        id: 1,
        idCliente: 101,
        cliente: 'CLIENTE PRUEBA 1',
        comprobante: 'OC-0001',
        fecha: '2026-04-20',
        estado: 'PENDIENTE',
        metodoDespacho: 'Retira en Fábrica',
        archivo: { nombre: 'orden1.pdf', archivo: 'JVBERi0xLjQKJ...' },
        detalle: [
            {
                id: 1,
                idPieza: 1,
                pieza: 'Pieza A',
                valorCotizacion: 1500,
                fechaCotizacion: '2026-04-01',
                entregasSolicitadas: [
                    { id: 1, cantidad: 100, fechaEntregaSolicitada: '2026-05-01' }
                ]
            }
        ]
    },
    {
        id: 2,
        idCliente: 102,
        cliente: 'CLIENTE PRUEBA 2',
        comprobante: 'OC-0002',
        fecha: '2026-04-21',
        estado: 'PENDIENTE',
        metodoDespacho: 'Envío por Camión',
        archivo: { nombre: 'orden2.pdf', archivo: 'JVBERi0xLjQKJ...' },
        detalle: [
            {
                id: 2,
                idPieza: 2,
                pieza: 'Pieza B',
                valorCotizacion: 2500,
                fechaCotizacion: '2026-04-05',
                entregasSolicitadas: [
                    { id: 2, cantidad: 50, fechaEntregaSolicitada: '2026-05-15' }
                ]
            }
        ]
    },
    {
        id: 3,
        idCliente: 103,
        cliente: 'CLIENTE FINALIZADO',
        comprobante: 'OC-0003',
        fecha: '2026-04-10',
        estado: 'FINALIZADA',
        metodoDespacho: 'Envío por Correo',
        archivo: { nombre: 'orden3.pdf', archivo: 'JVBERi0xLjQKJ...' },
        detalle: []
    }
];
