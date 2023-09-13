import { HttpClient, HttpBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// * Environment.
import { environment } from 'environments/environment';

// * Interfaces.
import { IMaterialsResponse } from '../models/material.interface';

@Injectable({
  providedIn: 'root',
})
export class MaterialsService {
  private url: string = `${environment.server}material`;

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public get(): Observable<IMaterialsResponse> {
    return this.http.get<IMaterialsResponse>(`${this.url}`);
  }
}
