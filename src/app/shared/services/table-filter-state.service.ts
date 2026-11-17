import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

export interface FilterStateConfig {
    pageParam?: string;
    pageSizeParam?: string;
    sortActiveParam?: string;
    sortDirectionParam?: string;
    excludeFromUrl?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class TableFilterStateService {

    constructor(private router: Router) { }

    public syncToUrl(
        route: ActivatedRoute,
        formValues: Record<string, any>,
        extraParams?: {
            pageIndex?: number;
            pageSize?: number;
            sortActive?: string;
            sortDirection?: string;
        },
        config?: FilterStateConfig
    ): void {
        const queryParams: Record<string, any> = {};

        if (formValues) {
            Object.keys(formValues).forEach(key => {
                const val = formValues[key];
                if (val !== null && val !== undefined && val !== '') {
                    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                        if (val.id !== undefined) {
                            queryParams[key] = val.id;
                            if (val.nombre) {
                                queryParams[`${key}_label`] = val.nombre;
                            } else if (val.denominacion) {
                                queryParams[`${key}_label`] = val.denominacion;
                            }
                        } else {
                            queryParams[key] = JSON.stringify(val);
                        }
                    } else if (val instanceof Date) {
                        queryParams[key] = val.toISOString();
                    } else {
                        queryParams[key] = val;
                    }
                } else {
                    queryParams[key] = null;
                    queryParams[`${key}_label`] = null;
                }
            });
        }

        const pageParam = config?.pageParam || 'page';
        const pageSizeParam = config?.pageSizeParam || 'pageSize';
        const sortActiveParam = config?.sortActiveParam || 'sortActive';
        const sortDirectionParam = config?.sortDirectionParam || 'sortDirection';

        if (extraParams?.pageIndex !== undefined && extraParams.pageIndex > 0) {
            queryParams[pageParam] = extraParams.pageIndex;
        } else {
            queryParams[pageParam] = null;
        }

        if (extraParams?.pageSize !== undefined) {
            queryParams[pageSizeParam] = extraParams.pageSize;
        }

        if (extraParams?.sortActive) {
            queryParams[sortActiveParam] = extraParams.sortActive;
            queryParams[sortDirectionParam] = extraParams.sortDirection || 'desc';
        }

        this.router.navigate([], {
            relativeTo: route,
            queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    public getQueryParams(route: ActivatedRoute): Record<string, any> {
        return route.snapshot.queryParams || {};
    }

    public clearUrl(route: ActivatedRoute): void {
        this.router.navigate([], {
            relativeTo: route,
            queryParams: {},
            replaceUrl: true
        });
    }
}
