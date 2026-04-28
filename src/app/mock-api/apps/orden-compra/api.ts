import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { FuseMockApiService } from '@fuse/lib/mock-api/mock-api.service';
import { ordenesCompra as ordenesCompraData } from 'app/mock-api/apps/orden-compra/data';
import * as moment from 'moment';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OrdenCompraMockApi {
    private _ordenesCompra: any[] = ordenesCompraData;

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    registerHandlers(): void {
        this._fuseMockApiService.onGet(environment.server + 'ordenCompra').reply(({ request }) => {
            const first = parseInt(request.params.get('first') || '0', 10);
            const rows = parseInt(request.params.get('rows') || '10', 10);
            const idx = request.params.get('idx') || 'fecha';
            const asc = request.params.get('asc') === 'true';

            let data = cloneDeep(this._ordenesCompra);

            data.sort((a, b) => {
                const fieldA = (a[idx] || '').toString().toLowerCase();
                const fieldB = (b[idx] || '').toString().toLowerCase();
                return asc ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
            });

            const totalReg = data.length;
            const page = data.slice(first, first + rows);

            return [200, { status: 'OK', data: { page, totalReg } }];
        });

        this._fuseMockApiService.onGet(environment.server + 'ordenCompra/:id').reply(({ request }) => {
            const id = parseInt(request.params.get('id'), 10);
            const item = this._ordenesCompra.find(o => o.id === id);
            return [200, { status: 'OK', data: item }];
        });

        this._fuseMockApiService.onPost(environment.server + 'ordenCompra').reply(({ request }) => {
            const body = request.body;
            const newId = Math.max(...this._ordenesCompra.map(o => o.id), 0) + 1;
            const newItem = { ...body, id: newId, estado: 'PENDIENTE' };
            this._ordenesCompra.push(newItem);
            return [200, { status: 'OK', data: newItem }];
        });

        this._fuseMockApiService.onPut(environment.server + 'ordenCompra/:id').reply(({ request }) => {
            const id = parseInt(request.params.get('id'), 10);
            const body = request.body;
            const index = this._ordenesCompra.findIndex(o => o.id === id);
            if (index > -1) {
                this._ordenesCompra[index] = { ...this._ordenesCompra[index], ...body };
                return [200, { status: 'OK', data: this._ordenesCompra[index] }];
            }
            return [404, { status: 'ERROR', message: 'Not found' }];
        });

        this._fuseMockApiService.onDelete(environment.server + 'ordenCompra/:id').reply(({ request }) => {
            const id = parseInt(request.params.get('id'), 10);
            const index = this._ordenesCompra.findIndex(o => o.id === id);
            if (index > -1) {
                this._ordenesCompra.splice(index, 1);
                return [200, { status: 'OK' }];
            }
            return [404, { status: 'ERROR', message: 'Not found' }];
        });

        this._fuseMockApiService.onPost(environment.server + 'ordenCompra/cancelar/:id').reply(({ request }) => {
            const id = parseInt(request.params.get('id'), 10);
            const index = this._ordenesCompra.findIndex(o => o.id === id);
            if (index > -1) {
                this._ordenesCompra[index].estado = 'CANCELADA';
                this._ordenesCompra[index].observacionesCancelacion = request.body.observaciones;
                return [200, { status: 'OK' }];
            }
            return [404, { status: 'ERROR', message: 'Not found' }];
        });

        this._fuseMockApiService.onGet(environment.server + 'ordenCompraArchivo/:id').reply(({ request }) => {
            const id = parseInt(request.params.get('id'), 10);
            const item = this._ordenesCompra.find(o => o.id === id);
            return [200, { 
                status: 'OK', 
                data: { 
                    archivoNombre: item?.archivo?.nombre || 'archivo.pdf', 
                    archivoContenido: item?.archivo?.archivo || '' 
                } 
            }];
        });
    }
}
