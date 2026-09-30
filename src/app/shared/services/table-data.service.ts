import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, OperatorFunction, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
    NormalizedTableResult,
    TableQueryParams
} from '../models/table-response.model';

@Injectable({
    providedIn: 'root'
})
export class TableDataService {

    constructor(private http: HttpClient) { }

    public normalizeResponse<T = any>(
        response: any,
        fallbackPageSize: number = 10
    ): NormalizedTableResult<T> {
        if (!response) {
            return {
                items: [],
                total: 0,
                data: [],
                totalReg: 0,
                pageIndex: 0,
                pageSize: fallbackPageSize,
                search: null,
                rawResponse: response
            };
        }

        if (Array.isArray(response)) {
            const arr = response as T[];
            return {
                items: arr,
                total: arr.length,
                data: arr,
                totalReg: arr.length,
                pageIndex: 0,
                pageSize: fallbackPageSize,
                search: null,
                rawResponse: response
            };
        }

        let items: T[] = [];
        let total = 0;
        let pageIndex = 0;
        let pageSize = fallbackPageSize;
        let search: string | null = null;

        if (Array.isArray(response.data)) {
            items = response.data as T[];

            if (response.page && typeof response.page === 'object') {
                total = response.page.totalReg ?? response.page.total ?? items.length;
                pageIndex = response.page.page ?? 0;
                pageSize = response.page.pageSize ?? fallbackPageSize;
                search = response.page.search ?? null;
            } else if (response.totalReg !== undefined && response.totalReg !== null) {
                total = response.totalReg;
            } else if (response.total !== undefined && response.total !== null) {
                total = response.total;
            } else {
                total = items.length;
            }
        }

        else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.page)) {
            items = response.data.page as T[];
            total = response.data.totalReg ?? items.length;
            pageIndex = response.data.pageIndex ?? response.data.page ?? 0;
            pageSize = response.data.pageSize ?? fallbackPageSize;
            search = response.data.search ?? null;
        }

        else if (Array.isArray(response.page)) {
            items = response.page as T[];
            total = response.totalReg ?? items.length;
        }

        else if (response.data && typeof response.data === 'object') {
            items = [response.data as T];
            total = 1;
        }

        return {
            items,
            total,
            data: items,
            totalReg: total,
            pageIndex,
            pageSize,
            search,
            rawResponse: response
        };
    }

    public extractItems<T = any>(response: any): T[] {
        return this.normalizeResponse<T>(response).items;
    }

    public extractTotal(response: any): number {
        return this.normalizeResponse(response).total;
    }

    public transformResponse<T = any>(
        fallbackPageSize: number = 10
    ): OperatorFunction<any, NormalizedTableResult<T>> {
        return (source$: Observable<any>) =>
            source$.pipe(
                map((res) => this.normalizeResponse<T>(res, fallbackPageSize)),
                catchError((err) => {
                    console.error('Error al procesar respuesta de tabla:', err);
                    return of({
                        items: [],
                        total: 0,
                        data: [],
                        totalReg: 0,
                        pageIndex: 0,
                        pageSize: fallbackPageSize,
                        search: null,
                        rawResponse: err
                    });
                })
            );
    }

    public buildHttpParams(options?: TableQueryParams | { [key: string]: any }): HttpParams {
        let httpParams = new HttpParams();

        if (!options) {
            return httpParams;
        }

        const rawParams: { [key: string]: any } = { ...options };

        if (rawParams.pageSize === undefined && rawParams.rows !== undefined) {
            rawParams.pageSize = rawParams.rows;
        }

        if (rawParams.page === undefined) {
            if (rawParams.pageIndex !== undefined) {
                rawParams.page = rawParams.pageIndex;
            } else if (rawParams.first !== undefined) {
                const size = rawParams.pageSize || rawParams.rows || 10;
                rawParams.page = Math.floor(rawParams.first / size);
            }
        }

        if (rawParams.idx === undefined) {
            if (rawParams.sortField !== undefined) {
                rawParams.idx = rawParams.sortField;
            } else if (rawParams.active !== undefined) {
                rawParams.idx = rawParams.active;
            }
        }
        if (rawParams.asc === undefined) {
            if (rawParams.sortDirection !== undefined) {
                rawParams.asc = rawParams.sortDirection === 'asc' || rawParams.sortDirection === true;
            } else if (rawParams.direction !== undefined) {
                rawParams.asc = rawParams.direction === 'asc';
            }
        }

        if (rawParams.filters && typeof rawParams.filters === 'object') {
            Object.keys(rawParams.filters).forEach(fk => {
                if (rawParams[fk] === undefined) {
                    rawParams[fk] = rawParams.filters[fk];
                }
            });
            delete rawParams.filters;
        }

        delete rawParams.first;
        delete rawParams.rows;
        delete rawParams.pageIndex;
        delete rawParams.sortField;
        delete rawParams.sortDirection;
        delete rawParams.active;
        delete rawParams.direction;

        Object.keys(rawParams).forEach(key => {
            const value = rawParams[key];
            if (value !== null && value !== undefined && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        httpParams = httpParams.append(key, String(item));
                    });
                } else {
                    httpParams = httpParams.set(key, String(value));
                }
            }
        });

        return httpParams;
    }

    public getTableData<T = any>(
        url: string,
        params?: TableQueryParams | { [key: string]: any },
        fallbackPageSize: number = 10
    ): Observable<NormalizedTableResult<T>> {
        const httpParams = this.buildHttpParams(params);

        return this.http.get<any>(url, { params: httpParams }).pipe(
            this.transformResponse<T>(fallbackPageSize)
        );
    }

    public updateDataSource<T = any>(
        dataSource: MatTableDataSource<T> | null,
        items: T[]
    ): MatTableDataSource<T> {
        if (!dataSource) {
            return new MatTableDataSource<T>(items);
        }
        dataSource.data = items;
        return dataSource;
    }

    public updatePaginator(paginator?: MatPaginator, total?: number): void {
        if (paginator && total !== undefined) {
            paginator.length = total;
        }
    }
}
