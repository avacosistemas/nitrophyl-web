import { HttpClient, HttpBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { ITest } from '../models/test.model';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private url: string = `${environment.server}maquina/prueba`;

  constructor(private http: HttpClient, private handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  public updateTestPositions(tests: ITest[]): Observable<any> {
    const requests = tests.map((test) => {
      const url = `${this.url}/${test.id}`;
      return this.http.put<any>(url, test).pipe(
        catchError((error) => {
          console.error(`Error al actualizar prueba ${test.id}:`, error);
          return of(null);
        })
      );
    });
    return forkJoin(requests).pipe(
      map((responses) => {
        const updatedData = responses.filter(res => res !== null);
        return {
          status: 'OK',
          data: updatedData.length > 0 ? updatedData : null,
        };
      })
    );
  }

  public getTest(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(
      catchError((error) => {
        console.error('Error al obtener las pruebas:', error);
        return of([]);
      })
    );
  }

  public addTest(idMaquina: number, test: ITest): Observable<any> {
    return this.http.put<any>(`${this.url}/${idMaquina}`, test).pipe(
      catchError((error) => {
        console.error('Error al agregar la prueba:', error);
        return of({ status: 'ERROR' });
      })
    );
  }

  // public setTest(body: any): Observable<any> {
  //   return this.http.put<any>(`${this.url}/${body.idMaquina}`, body.moldeClientesListadoDTOs).pipe(
  //     catchError(error => {
  //       console.error('Error al establecer la prueba:', error);
  //       return of({ status: 'ERROR' });
  //     })
  //   );
  // }

  public deleteTest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`).pipe(
      catchError((error) => {
        console.error('Error al eliminar la prueba:', error);
        return of({ status: 'ERROR' });
      })
    );
  }
}
