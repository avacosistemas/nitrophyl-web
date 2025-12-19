import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable()
export class MockRedirectInterceptor implements HttpInterceptor {

    private mockEndpoints: string[] = [
        '/ordenCompra',
        '/ordenFabricacion',
        '/ordenesCompra/porCliente',
        '/piezas/paraFabricacion',
        '/piezas/stock',
        '/piezas/cotizacion'
    ];

    constructor() { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!environment.enableMockup) {
            return next.handle(req);
        }

        const isMockable = this.mockEndpoints.some(endpoint => req.url.includes(endpoint));

        if (isMockable) {
            const newUrl = req.url.replace(environment.server, environment.mockServer);
            const mockReq = req.clone({ url: newUrl });
            return next.handle(mockReq);
        }

        return next.handle(req);
    }
}