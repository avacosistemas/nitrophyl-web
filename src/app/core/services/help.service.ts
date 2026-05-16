import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface HelpDTO {
    id?: number;
    path: string;
    content: string;
}

export interface ApiResponse<T> {
    data: T;
    status: string;
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

    getHelp(path: string): Observable<HelpDTO | null> {
        return this._httpClient.get<ApiResponse<HelpDTO>>(`${this._apiUrl}?path=${encodeURIComponent(path)}`).pipe(
            map(res => res.data),
            catchError((error) => {
                if (error.status === 404) {
                    return of(null);
                }
                throw error;
            })
        );
    }

    saveHelp(help: HelpDTO): Observable<boolean> {
        if (help.id) {
            return this._httpClient.put<ApiResponse<HelpDTO>>(`${this._apiUrl}/${help.id}`, help).pipe(
                map(() => true),
                catchError(() => of(false))
            );
        } else {
            return this._httpClient.post<ApiResponse<HelpDTO>>(this._apiUrl, help).pipe(
                map(() => true),
                catchError(() => of(false))
            );
        }
    }
}
