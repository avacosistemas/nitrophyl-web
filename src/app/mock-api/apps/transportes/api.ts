import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { FuseMockApiService } from '@fuse/lib/mock-api/mock-api.service';
import { transportes as transportesData } from 'app/mock-api/apps/transportes/data';

import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TransportesMockApi {
    private _transportes: any[] = transportesData;

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    registerHandlers(): void {
        this._fuseMockApiService.onGet(environment.server + 'transportes').reply(({ request }) => {
            return [200, { status: 'OK', data: cloneDeep(this._transportes) }];
        });
    }
}
