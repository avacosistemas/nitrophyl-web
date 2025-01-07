// lot-update.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root' // O en el módulo específico si no quieres que sea singleton
})
export class LotUpdateService {
  private updateTableSubject = new Subject<void>();

  updateTable$ = this.updateTableSubject.asObservable();

  requestUpdate(): void {
    this.updateTableSubject.next();
  }
}
