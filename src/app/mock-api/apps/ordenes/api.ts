import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { MOCK_ORDENES_COMPRA, MOCK_PIEZAS } from 'app/mock-api/apps/ordenes/data';

@Injectable({ providedIn: 'root' })
export class OrdenesMockApi {
    private _piezas: any[] = MOCK_PIEZAS;

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    registerHandlers(): void {
        this._fuseMockApiService.onGet('api/ordenesCompra/porCliente/:idCliente')
            .reply(({ urlParams }) => {
                const idCliente = urlParams['idCliente'];
                const clienteData = MOCK_ORDENES_COMPRA.find(c => c.idCliente === Number(idCliente));

                return [
                    200,
                    {
                        status: 'OK',
                        data: clienteData ? clienteData.ordenes : []
                    }
                ];
            });

        this._fuseMockApiService.onGet('api/piezas/paraFabricacion')
            .reply(() => {
                return [
                    200,
                    {
                        status: 'OK',
                        data: MOCK_PIEZAS
                    }
                ];
            });


        this._fuseMockApiService.onGet('api/piezas/stock/:id')
            .reply(({ urlParams }) => {
                const id = Number(urlParams['id']);
                const piezaEncontrada = this._piezas.find(p => p.id === id);

                return [
                    200,
                    {
                        status: 'OK',
                        data: {
                            idPieza: id,
                            stock: piezaEncontrada ? piezaEncontrada.stock : 0
                        }
                    }
                ];
            });

        this._fuseMockApiService.onGet('api/piezas/cotizacion/:idPieza/:idCliente')
            .reply(({ urlParams }) => {
                const idPieza = Number(urlParams['idPieza']);

                if (idPieza === 103) {
                    return [200, { status: 'OK', data: { tieneCotizacion: false } }];
                }

                return [200, {
                    status: 'OK',
                    data: {
                        tieneCotizacion: true,
                        valor: 1250.50,
                        fecha: '2025-01-01'
                    }
                }];
            });
    }
}