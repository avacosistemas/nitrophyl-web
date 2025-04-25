import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import { IMaterialsResponse } from '../models/material.interface';

@Injectable({
  providedIn: 'root',
})
export class MaterialsService {
  private url: string = `${environment.server}material?idx=nombre&asc=true`;

  constructor(private http: HttpClient) {
  }

  public get(): Observable<IMaterialsResponse> {
    return this.http.get<IMaterialsResponse>(`${this.url}`);
  }
}