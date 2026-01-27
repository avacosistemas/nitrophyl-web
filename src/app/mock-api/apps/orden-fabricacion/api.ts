import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { FuseMockApiService } from '@fuse/lib/mock-api/mock-api.service';
import {
    ordenesFabricacion as ordenesFabricacionData,
    piezas as piezasData,
    stockPiezas as stockPiezasData,
    cotizacionesPiezas as cotizacionesData,
    ordenesCompraCliente as ordenesCompraClienteData
} from 'app/mock-api/apps/orden-fabricacion/data';
import * as moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class OrdenFabricacionMockApi {
    private _ordenesFabricacion: any[] = ordenesFabricacionData;
    private _piezas: any[] = piezasData;
    private _stockPiezas: any[] = stockPiezasData;
    private _cotizaciones: any[] = cotizacionesData;
    private _ordenesCompraCliente: any = ordenesCompraClienteData;

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    registerHandlers(): void {

        this._fuseMockApiService.onGet('api/ordenFabricacion').reply(({ request }) => {
            const first = parseInt(request.params.get('first') || '0', 10);
            const rows = parseInt(request.params.get('rows') || '10', 10);
            const idx = request.params.get('idx') || 'fecha';
            const asc = request.params.get('asc') === 'true';


            const idCliente = request.params.get('idCliente');
            const fechaDesde = request.params.get('fechaDesde');
            const fechaHasta = request.params.get('fechaHasta');
            const nroOrden = request.params.get('nroOrden');
            const estado = request.params.get('estado');

            let data = cloneDeep(this._ordenesFabricacion);

            if (idCliente) {
                data = data.filter(of => of.idCliente == idCliente);
            }
            if (nroOrden) {
                data = data.filter(of => of.nroOrden.toLowerCase().includes(nroOrden.toLowerCase()));
            }
            if (estado && estado !== '') {
                data = data.filter(of => of.estado === estado);
            }
            if (fechaDesde) {
                data = data.filter(of => moment(of.fecha).isSameOrAfter(moment(fechaDesde, 'DD/MM/YYYY'), 'day'));
            }
            if (fechaHasta) {
                data = data.filter(of => moment(of.fecha).isSameOrBefore(moment(fechaHasta, 'DD/MM/YYYY'), 'day'));
            }

            if (idx) {
                data.sort((a, b) => {

                    const fieldA = (a[idx] !== null && a[idx] !== undefined) ? a[idx].toString().toLowerCase() : '';
                    const fieldB = (b[idx] !== null && b[idx] !== undefined) ? b[idx].toString().toLowerCase() : '';
                    return asc ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
                });
            }

            const totalReg = data.length;
            const page = data.slice(first, first + rows);

            return [200, { status: 'OK', data: { page, totalReg } }];
        });

        this._fuseMockApiService.onPost('api/ordenFabricacion').reply(({ request }) => {
            const reqBody = request.body;

            const newOrder = {
                id: this._ordenesFabricacion.length + 1,
                nroOrden: `${8550 + this._ordenesFabricacion.length}`,
                estado: 'PENDIENTE',
                prensa: null,
                operario: null,
                fechaEstimada: null,
                fechaEntregada: null,

                idCliente: reqBody.idCliente,
                clienteNombre: 'Cliente Simulado',
                fecha: reqBody.fecha ? moment(reqBody.fecha).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                ordenCompraNro: 'NEW-OC',
                ordenCompraFecha: moment().format('YYYY-MM-DD'),
                piezas: reqBody.piezas.map((p, i) => ({
                    id: i + 1,
                    idPieza: p.idPieza,
                    nombrePieza: 'Pieza Simulada',
                    formula: 'XX',
                    cantidadSolicitada: p.cantidadSolicitada,
                    cantidadAFabricar: p.cantidadAFabricar,
                    stockActual: 0,
                    cotizacionValor: p.cotizacionValor || 0
                }))
            };

            this._ordenesFabricacion.push(newOrder);
            return [201, { status: 'OK', data: newOrder }];
        });

        this._fuseMockApiService.onGet('api/ordenesCompra/porCliente/:idCliente').reply(({ request }) => {
            const idCliente = +request.params.get('idCliente');
            const ordenes = this._ordenesCompraCliente[idCliente] || [];
            return [200, { status: 'OK', data: ordenes }];
        });




        this._fuseMockApiService.onGet('api/piezas/paraFabricacion').reply(({ request }) => {
            const idCliente = request.params.get('idCliente');
            const soloDelCliente = request.params.get('soloDelCliente') === 'true';

            let piezasFiltradas = cloneDeep(this._piezas);

            if (idCliente && soloDelCliente) {
                piezasFiltradas = piezasFiltradas.filter(p => p.idCliente == idCliente);
            }
            return [200, { status: 'OK', data: piezasFiltradas }];
        });

        this._fuseMockApiService.onGet('api/piezas/stock/:idPieza').reply(({ request }) => {
            const idPieza = +request.params.get('idPieza');
            const stockInfo = this._stockPiezas.find(s => s.idPieza === idPieza);
            return [200, { status: 'OK', data: stockInfo || { idPieza, stock: 0 } }];
        });

        this._fuseMockApiService.onGet('api/piezas/cotizacion/:idPieza/:idCliente').reply(({ request }) => {
            const idPieza = +request.params.get('idPieza');
            const idCliente = +request.params.get('idCliente');
            const cotizacion = this._cotizaciones.find(c => c.idPieza === idPieza && c.idCliente === idCliente);

            if (cotizacion) {
                return [200, { status: 'OK', data: cotizacion }];
            }
            return [200, { status: 'OK', data: { tieneCotizacion: false } }];
        });
    }
}