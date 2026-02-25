import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface HelpContent {
    path: string;
    content: string;
}

@Injectable({
    providedIn: 'root'
})
export class HelpService {
    private _apiUrl = environment.server + 'ayuda-dinamica';

    constructor(private _httpClient: HttpClient) { }

    normalizeUrl(url: string): string {
        if (!url) return '';

        let pathOnly = url.split('?')[0];

        try {
            const urlObj = new URL(url);
            pathOnly = urlObj.pathname;
        } catch (e) {
            // 
        }

        const segments = pathOnly.split('/');

        const normalizedSegments = segments.map(segment => {
            if (segment && !isNaN(Number(segment))) {
                return ':id';
            }
            return segment;
        });

        let normalized = normalizedSegments.join('/');

        normalized = normalized.replace(/\/+/g, '/');

        return normalized;
    }

    getHelp(path: string): Observable<string> {
        const saved = localStorage.getItem(`help_static_${path}`);

        // Evitar que el string literal "null" se devuelva como contenido
        const content = (saved === 'null' || saved === null) ? '' : saved;

        return of(content).pipe(delay(500));

        /* 
        return this._httpClient.get<HelpContent>(`${this._apiUrl}?path=${encodeURIComponent(path)}`).pipe(
            map(res => res.content),
            catchError(() => of(''))
        );
        */
    }

    saveHelp(path: string, content: string): Observable<boolean> {
        localStorage.setItem(`help_static_${path}`, content);
        return of(true).pipe(delay(500));

        /*
        return this._httpClient.post(this._apiUrl, { path, content }).pipe(
            map(() => true),
            catchError(() => of(false))
        );
        */
    }
}
