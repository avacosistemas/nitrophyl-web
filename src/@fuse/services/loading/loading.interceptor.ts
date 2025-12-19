import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { FuseLoadingService } from '@fuse/services/loading/loading.service';
import { environment } from 'environments/environment';

@Injectable()
export class FuseLoadingInterceptor implements HttpInterceptor
{
    handleRequestsAutomatically: boolean;

    private mockEndpoints: string[] = [
        '/ordenCompra',
        '/ordenesCompra/porCliente',
        '/ordenFabricacion',
        '/piezas/paraFabricacion',
        '/piezas/stock',
        '/piezas/cotizacion'
    ];

    /**
     * Constructor
     */
    constructor(
        private _fuseLoadingService: FuseLoadingService
    )
    {
        // Subscribe to the auto
        this._fuseLoadingService.auto$
            .subscribe((value) => {
                this.handleRequestsAutomatically = value;
            });
    }

    /**
     * Intercept
     *
     * @param req
     * @param next
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
    {
        let newReq = req.clone();

        if (environment.enableMockup) {
            const isMockable = this.mockEndpoints.some(endpoint => req.url.includes(endpoint));
            if (isMockable) {
                const newUrl = req.url.replace(environment.server, environment.mockServer);
                newReq = req.clone({ url: newUrl });
            }
        }

        if ( !this.handleRequestsAutomatically )
        {
            return next.handle(newReq);
        }

        this._fuseLoadingService._setLoadingStatus(true, newReq.url);

        return next.handle(newReq).pipe(
            finalize(() => {
                this._fuseLoadingService._setLoadingStatus(false, newReq.url);
            }));
    }
}