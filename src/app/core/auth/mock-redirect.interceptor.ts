import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable()
export class MockRedirectInterceptor implements HttpInterceptor {

    private mockEndpoints: string[] = [
        'ordenFabricacion',
        'transportes'
    ];

    constructor() { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!environment.enableMockup) {
            return next.handle(req);
        }

        const foundEndpoint = this.mockEndpoints.find(endpoint => req.url.includes(endpoint));

        if (foundEndpoint) {
            const index = req.url.indexOf(foundEndpoint);
            let pathSuffix = req.url.substring(index);
            
            if (pathSuffix.startsWith('/')) {
                pathSuffix = pathSuffix.substring(1);
            }

            let mockServer = environment.mockServer;
            if (!mockServer.endsWith('/')) {
                mockServer += '/';
            }
            
            const newUrl = mockServer + pathSuffix;
            
            console.log(`[MockRedirect] Redirecting ${req.url} to ${newUrl}`);
            
            const mockReq = req.clone({ url: newUrl });
            return next.handle(mockReq);
        }
        
        return next.handle(req);
    }
}